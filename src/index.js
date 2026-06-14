require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const passwordRoutes = require('./routes/password');
const userRoutes = require('./routes/users');
const { errorHandler, notFound } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use((req, _res, next) => { req.url = req.url.replace(/(%0A|%0D|%0a|%0d|[\r\n])+$/g, ''); next(); });
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/', apiLimiter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

try {
  require('./db');
  console.log('Connected to SQLite');
  app.listen(PORT, () => console.log(`Auth server running on port ${PORT}`));
} catch (err) {
  console.error('SQLite connection error:', err.message);
  process.exit(1);
}

module.exports = app;
