const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { User } = require('../models');

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function setAuthCookies(res, accessToken, refreshToken) {
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  res.cookie(ACCESS_COOKIE, accessToken, {
    ...cookieOpts,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieOpts,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

function storeRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (token, userId, expiresAt) VALUES (?, ?, ?)').run(token, userId, expiresAt);
}

function verifyRefreshToken(token) {
  const row = db.prepare("SELECT * FROM refresh_tokens WHERE token = ? AND expiresAt > datetime('now')").get(token);
  if (!row) return null;
  return row;
}

function deleteRefreshToken(token) {
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
}

function deleteUserRefreshTokens(userId) {
  db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').run(userId);
}

function extractToken(req) {
  if (req.cookies?.[ACCESS_COOKIE]) return req.cookies[ACCESS_COOKIE];
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.split(' ')[1];
  return null;
}

const protect = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = User.findByPk(decoded.id);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'User no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Invalid access token' });
  }
};

const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = User.findByPk(decoded.id);
  } catch {
    // ignore
  }
  next();
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  storeRefreshToken,
  verifyRefreshToken,
  deleteRefreshToken,
  deleteUserRefreshTokens,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
};
