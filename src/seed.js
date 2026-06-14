require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

db.exec('DELETE FROM refresh_tokens; DELETE FROM reset_tokens; DELETE FROM users;');

const password = bcrypt.hashSync('password123', 12);

const insertUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
insertUser.run('Admin', 'admin@example.com', password, 'admin');
insertUser.run('John Doe', 'john@example.com', password, 'user');
insertUser.run('Jane Smith', 'jane@example.com', password, 'user');
insertUser.run('Bob Wilson', 'bob@example.com', password, 'user');

console.log('Seeded: 4 users');
process.exit(0);
