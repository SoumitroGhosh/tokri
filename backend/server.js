require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();

// Security
app.use(helmet());
app.use(cors());

// Rate limiting - max 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Health check - to verify server is running
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Tokri API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// Routes - we will add these one by one
app.use('/api/auth',     require('./src/routes/auth'));
app.use('/api/vendors',  require('./src/routes/vendors'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders',   require('./src/routes/orders'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/user',     require('./src/routes/user'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: `Route ${req.method} ${req.path} not found` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Something went wrong. Please try again.' 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════╗
  ║   Tokri API is running     ║
  ║   Port: ${PORT}               ║
  ║   Let's build something    ║
  ║   amazing! 🧺   ║
  ╚════════════════════════════╝
  `);
});

module.exports = app;