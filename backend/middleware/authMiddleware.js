const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const logger = require('../utils/logger');

// Protect routes - Verify JWT
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn('Access denied: No token provided');
    return res.status(401).json({ 
      success: false, 
      message: 'No autorizado, no se proporcionó un token de seguridad' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyiucmonedero2026!');

    // Get user from DB
    const user = await User.findByPk(decoded.id, {
      include: { model: Role, as: 'rol' }
    });

    if (!user) {
      logger.warn(`Access denied: User with ID ${decoded.id} not found in database`);
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado, el usuario ya no existe' 
      });
    }

    if (user.estado !== 'activo') {
      logger.warn(`Access denied: User with ID ${decoded.id} is inactive`);
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado, su cuenta está inactiva' 
      });
    }

    // Grant access to user object in request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'No autorizado, token inválido o expirado' 
    });
  }
};

// Restrict access to specific roles (by ID)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol_id)) {
      logger.warn(`Forbidden access: User ID ${req.user ? req.user.id : 'unknown'} with role ID ${req.user ? req.user.rol_id : 'none'} tried to access a restricted route.`);
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso prohibido: no tienes permisos para realizar esta acción' 
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
