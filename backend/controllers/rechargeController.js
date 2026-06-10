const { Recharge, Student, User } = require('../models');
const { sequelize } = require('../config/database');
const { generateRechargePDF } = require('../services/pdfService');
const { logAudit } = require('../services/auditService');
const logger = require('../utils/logger');

const createRecharge = async (req, res) => {
  const { codigo_estudiante, valor } = req.body;
  const adminId = req.user.id; // Registered by the logged-in admin

  if (!codigo_estudiante || !valor || parseFloat(valor) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Código de estudiante y un valor de recarga mayor a cero son requeridos.'
    });
  }

  // Database Transaction
  const transaction = await sequelize.transaction();

  try {
    // 1. Find Student
    const student = await Student.findOne({
      where: { codigo_estudiante },
      include: { model: User, as: 'usuario' },
      transaction
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `Estudiante con código '${codigo_estudiante}' no encontrado.`
      });
    }

    const valueToRecharge = parseFloat(valor);
    const oldBalance = parseFloat(student.saldo_actual);
    const newBalance = oldBalance + valueToRecharge;

    // 2. Update Student Balance
    student.saldo_actual = newBalance;
    await student.save({ transaction });

    // 3. Create Recharge Record
    const recharge = await Recharge.create({
      estudiante_id: student.id,
      valor: valueToRecharge,
      fecha: new Date(),
      usuario_registra_id: adminId
    }, { transaction });

    // Commit transaction to secure database balance change first
    await transaction.commit();

    // 4. Generate PDF Receipt
    let pdfFilename = null;
    try {
      const adminUser = req.user;
      pdfFilename = await generateRechargePDF(recharge, student, student.usuario, adminUser);
      
      // Update recharge record with PDF filename
      recharge.comprobante_pdf = pdfFilename;
      await recharge.save();
    } catch (pdfError) {
      logger.error('Failed to generate PDF receipt for recharge, but database state was committed:', pdfError);
      // We don't rollback the database transaction because the money was successfully credited.
    }

    // 5. Register Audit Log
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(
      adminId,
      `Registro de recarga por ${valueToRecharge} al estudiante código ${codigo_estudiante} (Transacción: REC-${recharge.id})`,
      ip
    );

    return res.status(201).json({
      success: true,
      message: 'Recarga registrada exitosamente.',
      data: {
        id: recharge.id,
        valor: valueToRecharge,
        fecha: recharge.fecha,
        comprobante: pdfFilename,
        nuevoSaldo: student.saldo_actual
      }
    });
  } catch (error) {
    logger.error('Error creating recharge:', error);
    // Rollback transaction if not committed
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return res.status(500).json({
      success: false,
      message: 'Error interno al registrar la recarga.'
    });
  }
};

const getRecharges = async (req, res) => {
  try {
    const recharges = await Recharge.findAll({
      include: [
        {
          model: Student,
          as: 'estudiante',
          include: { model: User, as: 'usuario', attributes: ['nombre', 'apellido'] }
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
      data: recharges
    });
  } catch (error) {
    logger.error('Error fetching recharges:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de recargas.'
    });
  }
};

const getRechargeById = async (req, res) => {
  const { id } = req.params;

  try {
    const recharge = await Recharge.findByPk(id, {
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
      ]
    });

    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: 'Recarga no encontrada.'
      });
    }

    // Permission check: Students and Acudientes can only see their own recharges
    if (req.user.rol_id === 1) { // Estudiante
      if (recharge.estudiante.usuario_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }
    } else if (req.user.rol_id === 2) { // Acudiente
      // We will check if this guardian is associated with the student in the acudiente dashboard controller, but here we can check as well
      const guardian = await Guardian.findOne({ where: { usuario_id: req.user.id } });
      const isAssociated = await student.hasAcudiente(guardian);
      if (!isAssociated) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }
    }

    return res.status(200).json({
      success: true,
      data: recharge
    });
  } catch (error) {
    logger.error('Error fetching recharge details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los detalles de la recarga.'
    });
  }
};

module.exports = {
  createRecharge,
  getRecharges,
  getRechargeById
};
