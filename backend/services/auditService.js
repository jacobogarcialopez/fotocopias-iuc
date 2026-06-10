const { Audit } = require('../models');
const logger = require('../utils/logger');

const logAudit = async (userId, action, ip = '127.0.0.1') => {
  try {
    await Audit.create({
      usuario_id: userId,
      accion: action,
      ip: ip,
      fecha: new Date()
    });
    logger.info(`[AUDIT] User ID: ${userId} | Action: ${action} | IP: ${ip}`);
  } catch (error) {
    logger.error('Failed to register audit event:', error);
  }
};

module.exports = {
  logAudit
};
