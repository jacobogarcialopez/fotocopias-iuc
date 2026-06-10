const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { QrToken, Student, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const generateQR = async (studentId) => {
  try {
    const token = uuidv4();
    const expirationTime = new Date(Date.now() + 60 * 1000); // 60 seconds from now

    // Clean up old tokens for this student
    await QrToken.destroy({
      where: { estudiante_id: studentId }
    });

    // Create new token
    await QrToken.create({
      estudiante_id: studentId,
      token: token,
      fecha_creacion: new Date(),
      fecha_expiracion: expirationTime
    });

    // Generate QR code as Data URI
    const qrDataUri = await QRCode.toDataURL(token, {
      color: {
        dark: '#1b5e20', // Green institutional
        light: '#ffffff'
      },
      width: 250,
      margin: 1
    });

    return {
      token,
      expiresAt: expirationTime,
      qrImage: qrDataUri
    };
  } catch (error) {
    logger.error(`Error generating QR for student ${studentId}:`, error);
    throw new Error('Error al generar el código QR.');
  }
};

const validateQR = async (token) => {
  try {
    const qrRecord = await QrToken.findOne({
      where: {
        token: token,
        fecha_expiracion: {
          [Op.gt]: new Date()
        }
      },
      include: {
        model: Student,
        as: 'estudiante',
        include: {
          model: User,
          as: 'usuario'
        }
      }
    });

    if (!qrRecord) {
      logger.warn(`Invalid or expired QR token validation attempt: ${token}`);
      return null;
    }

    const student = qrRecord.estudiante;

    // Immediately delete the token to enforce single-use (anti-replay)
    await QrToken.destroy({
      where: { id: qrRecord.id }
    });

    logger.info(`QR Token validated successfully for student: ${student.codigo_estudiante}`);
    return student;
  } catch (error) {
    logger.error('Error validating QR token:', error);
    throw new Error('Error al validar el código QR.');
  }
};

module.exports = {
  generateQR,
  validateQR
};
