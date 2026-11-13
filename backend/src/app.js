const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const csrfProtection = require('./middleware/csrfProtection');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
if (env.isProduction) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.frontendUrls, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', csrfProtection);

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'Sweety API is running', data: {} }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/readings', require('./routes/readingRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
