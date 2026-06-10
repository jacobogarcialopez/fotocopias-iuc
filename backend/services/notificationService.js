const { Notification, SystemConfig, Guardian, Student, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Checks if a student's balance is below the low balance threshold (5 copies).
 * If so, generates database notifications for the student and their associated guardians.
 * @param {object} studentInstance - Sequelize student instance (loaded with user association)
 */
const checkAndNotifyLowBalance = async (studentInstance) => {
  try {
    // 1. Get photocopy price from configuration
    const priceConfig = await SystemConfig.findOne({ where: { clave: 'precio_copia' } });
    const pricePerCopy = priceConfig ? parseFloat(priceConfig.valor) : 150.00;
    
    // 5 copies threshold
    const lowBalanceThreshold = 5 * pricePerCopy;
    const currentBalance = parseFloat(studentInstance.saldo_actual);

    logger.debug(`Checking balance for student ID ${studentInstance.id}. Balance: ${currentBalance}, Threshold: ${lowBalanceThreshold}`);

    if (currentBalance < lowBalanceThreshold) {
      // 2. Load associations if they aren't loaded
      let student = studentInstance;
      if (!student.usuario) {
        student = await Student.findByPk(studentInstance.id, {
          include: [
            { model: User, as: 'usuario' },
            { model: Guardian, as: 'acudientes', include: { model: User, as: 'usuario' } }
          ]
        });
      }

      // 3. Compose warning message
      const message = `Alerta de Saldo Bajo: El estudiante ${student.usuario.nombre} ${student.usuario.apellido} (Código: ${student.codigo_estudiante}) tiene un saldo de $${currentBalance.toFixed(0)}, el cual es inferior a la cantidad recomendada para 5 copias ($${lowBalanceThreshold.toFixed(0)}). Por favor realice una recarga.`;

      // 4. Check if a similar unread notification was sent today to avoid flooding
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existingNotif = await Notification.findOne({
        where: {
          usuario_id: student.usuario.id,
          mensaje: message,
          leida: false
        }
      });

      if (existingNotif) {
        logger.info(`Low balance notification already exists for student ID ${student.id} today. Skipping creation.`);
        return;
      }

      // 5. Create notification for the Student
      await Notification.create({
        usuario_id: student.usuario.id,
        mensaje: message,
        leida: false,
        fecha: new Date()
      });
      logger.info(`[NOTIFICATION SMS/EMAIL SIMULATION] Sent to Student ${student.usuario.correo}: "${message}"`);

      // 6. Create notification for all associated Guardians (Acudientes)
      if (student.acudientes && student.acudientes.length > 0) {
        for (const guardian of student.acudientes) {
          await Notification.create({
            usuario_id: guardian.usuario.id,
            mensaje: message,
            leida: false,
            fecha: new Date()
          });
          logger.info(`[NOTIFICATION SMS/EMAIL SIMULATION] Sent to Guardian ${guardian.usuario.correo} (Tel: ${guardian.telefono}): "${message}"`);
        }
      }
    }
  } catch (error) {
    logger.error(`Error checking balance or sending notifications for student:`, error);
  }
};

module.exports = {
  checkAndNotifyLowBalance
};
