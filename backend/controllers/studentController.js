const { Student, User, Recharge, Consume, Role } = require('../models');
const { generateQR } = require('../services/qrService');
const logger = require('../utils/logger');

// Get profile of the logged-in student
const getPerfil = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { usuario_id: req.user.id },
      include: {
        model: User,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'correo']
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de estudiante no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: student.id,
        codigo: student.codigo_estudiante,
        saldo: student.saldo_actual,
        nombre: student.usuario.nombre,
        apellido: student.usuario.apellido,
        correo: student.usuario.correo
      }
    });
  } catch (error) {
    logger.error('Error getting student profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al obtener el perfil.'
    });
  }
};

// Get current balance
const getSaldo = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { usuario_id: req.user.id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      saldo: parseFloat(student.saldo_actual)
    });
  } catch (error) {
    logger.error('Error getting balance:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el saldo.'
    });
  }
};

// Generate a new QR code token
const getQR = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { usuario_id: req.user.id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado.'
      });
    }

    const qrData = await generateQR(student.id);

    return res.status(200).json({
      success: true,
      data: qrData
    });
  } catch (error) {
    logger.error('Error generating student QR:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar el código QR dinámico.'
    });
  }
};

// Get unified history of recharges and consumes
const getMovimientos = async (req, res) => {
  const studentUserId = req.query.studentUserId || req.user.id;
  
  // Guard check: if requesting another student's history, check permissions
  // Acudiente can only see associated students, admin/rector can see any.
  if (studentUserId !== req.user.id) {
    if (req.user.rol_id !== 4 && req.user.rol_id !== 5 && req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver los movimientos de este estudiante.'
      });
    }
  }

  try {
    const student = await Student.findOne({
      where: { usuario_id: studentUserId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado.'
      });
    }

    // Fetch recharges
    const recharges = await Recharge.findAll({
      where: { estudiante_id: student.id },
      include: {
        model: User,
        as: 'usuarioRegistra',
        attributes: ['nombre', 'apellido']
      }
    });

    // Fetch consumes
    const consumes = await Consume.findAll({
      where: { estudiante_id: student.id },
      include: {
        model: User,
        as: 'usuarioRegistra',
        attributes: ['nombre', 'apellido']
      }
    });

    // Format and combine
    const rechargesMapped = recharges.map(r => ({
      id: r.id,
      tipo: 'recarga',
      valor: parseFloat(r.valor),
      cantidad: 0,
      fecha: r.fecha,
      pdf: r.comprobante_pdf,
      registradoPor: r.usuarioRegistra ? `${r.usuarioRegistra.nombre} ${r.usuarioRegistra.apellido}` : 'Sistema'
    }));

    const consumesMapped = consumes.map(c => ({
      id: c.id,
      tipo: 'consumo',
      valor: parseFloat(c.valor),
      cantidad: c.cantidad_copias,
      fecha: c.fecha,
      pdf: null,
      registradoPor: c.usuarioRegistra ? `${c.usuarioRegistra.nombre} ${c.usuarioRegistra.apellido}` : 'Fotocopiadora'
    }));

    // Merge and sort descending
    const movimientos = [...rechargesMapped, ...consumesMapped].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return res.status(200).json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    logger.error('Error getting movements:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de movimientos.'
    });
  }
};

module.exports = {
  getPerfil,
  getSaldo,
  getQR,
  getMovimientos
};
