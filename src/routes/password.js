const { Router } = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const db = require('../db');
const { User } = require('../models');
const validate = require('../middleware/validate');
const { passwordResetLimiter } = require('../middleware/rateLimiter');

const router = Router();

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

router.post('/forgot', passwordResetLimiter, validate(forgotSchema), (req, res) => {
  const user = User.findOne({ email: req.body.email });

  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO reset_tokens (token, userId, expiresAt) VALUES (?, ?, ?)').run(token, user.id, expiresAt);

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n  Password reset link: ${resetUrl}\n`);
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

router.post('/reset', validate(resetSchema), (req, res, next) => {
  try {
    const row = db.prepare(
      "SELECT * FROM reset_tokens WHERE token = ? AND used = 0 AND expiresAt > datetime('now')"
    ).get(req.body.token);

    if (!row) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    User.update(row.userId, { password: req.body.password });
    db.prepare('UPDATE reset_tokens SET used = 1 WHERE id = ?').run(row.id);
    db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').run(row.userId);

    res.json({ message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
