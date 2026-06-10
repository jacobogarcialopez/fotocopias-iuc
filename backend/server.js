const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const logger = require('./utils/logger');
const { sequelize, testConnection } = require('./config/database');

// Import routers
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const rechargeRoutes = require('./routes/rechargeRoutes');
const consumeRoutes = require('./routes/consumeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const guardianRoutes = require('./routes/guardianRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(cors());

// Configure Helmet (adjusting Content Security Policy to allow Tailwind CSS & Google Fonts CDN)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:3000", "ws://localhost:3000"]
    }
  }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta dirección IP. Intente de nuevo más tarde.'
  }
});
app.use('/api/', limiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded PDFs (comprobantes)
const uploadsDir = path.join(__dirname, 'uploads/comprobantes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/comprobantes', express.static(uploadsDir));

// Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/estudiantes', studentRoutes);
app.use('/api/recargas', rechargeRoutes);
app.use('/api/consumos', consumeRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/acudiente', guardianRoutes);
app.use('/api/reportes', reportRoutes);

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to login page for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor.'
  });
});

// Initialize database connection & start server
const startServer = async () => {
  await testConnection();
  
  // Try to sync database models in development (not forcing alter/force for production safety)
  if (process.env.NODE_ENV === 'development') {
    try {
      await sequelize.sync();
      logger.info('Database models synced successfully.');
    } catch (syncErr) {
      logger.error('Failed to sync database models, database tables might already exist:', syncErr);
    }
  }

  app.listen(PORT, () => {
    logger.info(`IUC Photocopy Digital Wallet Server started on port ${PORT} in ${process.env.NODE_ENV} mode.`);
    logger.info(`Access frontend application at: http://localhost:${PORT}`);
  });
};

startServer();
