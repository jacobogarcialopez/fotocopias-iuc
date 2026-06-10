const jwt = require('jsonwebtoken');
const { User, Role, Student, Guardian } = require('../models');
const { logAudit } = require('../services/auditService');
const logger = require('../utils/logger');

const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({
      success: false,
      message: 'Por favor, proporcione un correo y contraseña.'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({
      where: { correo },
      include: { model: Role, as: 'rol' }
    });

    if (!user) {
      logger.warn(`Failed login attempt for email: ${correo} (User not found)`);
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.'
      });
    }

    if (user.estado !== 'activo') {
      logger.warn(`Failed login attempt for inactive user: ${correo}`);
      return res.status(401).json({
        success: false,
        message: 'Su cuenta está inactiva. Comuníquese con la administración.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(contrasena);
    if (!isMatch) {
      logger.warn(`Failed login attempt for email: ${correo} (Incorrect password)`);
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, rol_id: user.rol_id },
      process.env.JWT_SECRET || 'supersecretkeyiucmonedero2026!',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Fetch related profiles if necessary
    let profileData = {};
    if (user.rol_id === 1) { // Estudiante
      const student = await Student.findOne({ where: { usuario_id: user.id } });
      if (student) profileData = { studentId: student.id, codigo: student.codigo_estudiante, saldo: student.saldo_actual };
    } else if (user.rol_id === 2) { // Acudiente
      const guardian = await Guardian.findOne({ where: { usuario_id: user.id } });
      if (guardian) profileData = { guardianId: guardian.id, telefono: guardian.telefono };
    }

    // Register audit event
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(user.id, 'Inicio de sesión exitoso', ip);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rolId: user.rol_id,
        rolNombre: user.rol.nombre,
        ...profileData
      }
    });
  } catch (error) {
    logger.error('Error logging in user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};

const logout = async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(req.user.id, 'Cierre de sesión', ip);
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente.'
    });
  } catch (error) {
    logger.error('Error logging out:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al cerrar sesión.'
    });
  }
};

const forgotPassword = async (req, res) => {
  const { correo } = req.body;
  
  if (!correo) {
    return res.status(400).json({
      success: false,
      message: 'Por favor, proporcione su correo electrónico.'
    });
  }

  try {
    const user = await User.findOne({ where: { correo } });
    if (!user) {
      // Security practice: don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: 'Si el correo está registrado, se enviará un enlace de recuperación.'
      });
    }

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(user.id, 'Solicitud de recuperación de contraseña', ip);
    
    // Simulate sending an email
    logger.info(`[RECOVERY EMAIL SIMULATION] Recovery link requested for ${correo}`);

    return res.status(200).json({
      success: true,
      message: 'Si el correo está registrado, se enviará un enlace de recuperación.'
    });
  } catch (error) {
    logger.error('Error in forgotPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};

module.exports = {
  login,
  logout,
  forgotPassword
};
