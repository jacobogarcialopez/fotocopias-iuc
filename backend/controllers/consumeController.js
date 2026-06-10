const { Consume, Student, User, SystemConfig } = require('../models');
const { sequelize } = require('../config/database');
const { validateQR } = require('../services/qrService');
const { checkAndNotifyLowBalance } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const logger = require('../utils/logger');

const createConsume = async (req, res) => {
  const { token, codigo_estudiante, cantidad_copias } = req.body;
  const operatorId = req.user.id;

  if (!cantidad_copias || parseInt(cantidad_copias) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'La cantidad de copias debe ser mayor a cero.'
    });
  }

  const numCopies = parseInt(cantidad_copias);

  try {
    let student = null;

    // 1. Identify Student (QR Token or Manual Code)
    if (token) {
      student = await validateQR(token);
      if (!student) {
        return res.status(400).json({
          success: false,
          message: 'Código QR inválido o expirado. Genere uno nuevo.'
        });
      }
    } else if (codigo_estudiante) {
      student = await Student.findOne({
        where: { codigo_estudiante },
        include: { model: User, as: 'usuario' }
      });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Estudiante con código '${codigo_estudiante}' no encontrado.`
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Debe escanear un QR o ingresar el código del estudiante.'
      });
    }

    // 2. Load System Configuration Parameters
    const configPrice = await SystemConfig.findOne({ where: { clave: 'precio_copia' } });
    const configEmergency = await SystemConfig.findOne({ where: { clave: 'modo_emergencia' } });
    const configCredit = await SystemConfig.findOne({ where: { clave: 'credito_emergencia' } });

    const pricePerCopy = configPrice ? parseFloat(configPrice.valor) : 150.00;
    const isEmergencyMode = configEmergency ? configEmergency.valor === '1' : false;
    const emergencyCredit = configCredit ? parseFloat(configCredit.valor) : 1500.00;

    const totalCost = numCopies * pricePerCopy;
    const currentBalance = parseFloat(student.saldo_actual);
    const potentialBalance = currentBalance - totalCost;

    // 3. Validate Balance
    if (potentialBalance < 0) {
      if (isEmergencyMode) {
        // Under emergency mode, check if negative balance exceeds credit limit
        if (potentialBalance < -emergencyCredit) {
          return res.status(400).json({
            success: false,
            message: `Saldo insuficiente. El modo de emergencia está activo, pero el consumo supera el crédito disponible de $${emergencyCredit.toFixed(0)}.`
          });
        }
        logger.info(`Emergency Mode active: Student ${student.codigo_estudiante} approved for negative balance. Current: ${currentBalance}, Cost: ${totalCost}`);
      } else {
        return res.status(400).json({
          success: false,
          message: `Saldo insuficiente. El costo del consumo es $${totalCost.toFixed(0)} y su saldo actual es $${currentBalance.toFixed(0)}.`
        });
      }
    }

    // 4. Update Student Balance (Database Transaction)
    const transaction = await sequelize.transaction();
    try {
      student.saldo_actual = potentialBalance;
      await student.save({ transaction });

      // 5. Create Consume Record
      const consume = await Consume.create({
        estudiante_id: student.id,
        cantidad_copias: numCopies,
        valor: totalCost,
        fecha: new Date(),
        usuario_registra_id: operatorId
      }, { transaction });

      await transaction.commit();

      // 6. Register Audit Log
      const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
      await logAudit(
        operatorId,
        `Registro de consumo de ${numCopies} copias ($${totalCost.toFixed(0)}) para estudiante ${student.codigo_estudiante} ${isEmergencyMode && potentialBalance < 0 ? '(Bajo Modo de Emergencia)' : ''}`,
        ip
      );

      // 7. Check low balance and notify in the background (do not block user response)
      // We pass the updated student to the service
      checkAndNotifyLowBalance(student);

      return res.status(201).json({
        success: true,
        message: 'Consumo registrado y descontado exitosamente.',
        data: {
          id: consume.id,
          estudianteCodigo: student.codigo_estudiante,
          nombreCompleto: `${student.usuario.nombre} ${student.usuario.apellido}`,
          cantidadCopias: numCopies,
          costoTotal: totalCost,
          nuevoSaldo: student.saldo_actual,
          modoEmergenciaAplicado: isEmergencyMode && potentialBalance < 0
        }
      });

    } catch (dbErr) {
      await transaction.rollback();
      logger.error('Database transaction error for consumption:', dbErr);
      return res.status(500).json({ success: false, message: 'Error en la base de datos al registrar el consumo.' });
    }

  } catch (error) {
    logger.error('Error registering consumption:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al registrar el consumo.'
    });
  }
};

const getConsumes = async (req, res) => {
  try {
    const consumes = await Consume.findAll({
      include: [
        {
          model: Student,
          as: 'estudiante',
          include: { model: User, as: 'usuario', attributes: ['nombre', 'apellido', 'correo'] }
        },
        {
          model: User,
          as: 'usuarioRegistra',
          attributes: ['nombre', 'apellido']
        }
      ],
      order: [['fecha', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: consumes
    });
  } catch (error) {
    logger.error('Error fetching consumes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los consumos.'
    });
  }
};

module.exports = {
  createConsume,
  getConsumes
};
