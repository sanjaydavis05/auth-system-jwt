const { Router } = require('express');
const { z } = require('zod');
const db = require('../db');
const { User } = require('../models');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

router.get('/', protect, restrictTo('admin'), (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  let whereSql = '';
  const params = [];
  if (req.query.search) {
    whereSql = 'WHERE name LIKE ? OR email LIKE ?';
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM users ${whereSql}`).get(...params).c;
  const users = db.prepare(
    `SELECT id, name, email, role, createdAt, updatedAt FROM users ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({ users, page, limit, total, pages: Math.ceil(total / limit) });
});

router.get('/:id', protect, (req, res) => {
  const user = User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({ user });
});

router.put('/:id', protect, validate(updateUserSchema), (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role !== 'admin' && req.body.role) {
      return res.status(403).json({ error: 'Cannot change role' });
    }

    const user = User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = User.update(parseInt(req.params.id), req.body);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, restrictTo('admin'), (req, res) => {
  const ok = User.destroy(parseInt(req.params.id));
  if (!ok) return res.status(404).json({ error: 'User not found' });
  res.status(204).send();
});

module.exports = router;
