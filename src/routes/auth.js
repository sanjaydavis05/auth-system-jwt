const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { User } = require('../models');
const validate = require('../middleware/validate');
const {
  protect, setAuthCookies, clearAuthCookies,
  storeRefreshToken, verifyRefreshToken, deleteRefreshToken,
  generateAccessToken, generateRefreshToken, REFRESH_COOKIE,
} = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', authLimiter, validate(registerSchema), (req, res, next) => {
  try {
    const existing = User.findOne({ email: req.body.email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const user = User.create(req.body);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    storeRefreshToken(user.id, refreshToken);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({ message: 'Registered successfully', user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, validate(loginSchema), (req, res, next) => {
  try {
    const user = User.findOneWithPassword({ email: req.body.email });
    if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    storeRefreshToken(user.id, refreshToken);
    setAuthCookies(res, accessToken, refreshToken);

    const { password, ...safe } = user;
    res.json({ message: 'Logged in successfully', user: safe, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', protect, (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) deleteRefreshToken(token);
  clearAuthCookies(res);
  res.json({ message: 'Logged out successfully' });
});

router.post('/refresh', (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const stored = verifyRefreshToken(token);
  if (!stored) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = User.findByPk(stored.userId);
  if (!user) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'User no longer exists' });
  }

  deleteRefreshToken(token);
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();
  storeRefreshToken(user.id, newRefreshToken);
  setAuthCookies(res, newAccessToken, newRefreshToken);

  res.json({ message: 'Token refreshed', accessToken: newAccessToken, refreshToken: newRefreshToken });
});

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
