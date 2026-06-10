const { Guardian, Student, User, Recharge } = require('../models');
const logger = require('../utils/logger');

const getAssociatedStudents = async (req, res) => {
  try {
    const guardian = await Guardian.findOne({
      where: { usuario_id: req.user.id },
      include: {
        model: Student,
        as: 'estudiantes',
        include: { model: User, as: 'usuario', attributes: ['nombre', 'apellido', 'correo'] }
      }
    });

    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de acudiente no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      data: guardian.estudiantes
    });
  } catch (error) {
    logger.error('Error fetching guardian students:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los estudiantes asociados.'
    });
  }
};

const getAssociatedRecharges = async (req, res) => {
  try {
    const guardian = await Guardian.findOne({
      where: { usuario_id: req.user.id },
      include: {
        model: Student,
        as: 'estudiantes',
        attributes: ['id']
      }
    });

    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de acudiente no encontrado.'
      });
    }

    const studentIds = guardian.estudiantes.map(s => s.id);

    const recharges = await Recharge.findAll({
      where: { estudiante_id: studentIds },
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
    logger.error('Error fetching guardian student recharges:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de recargas.'
    });
  }
};

module.exports = {
  getAssociatedStudents,
  getAssociatedRecharges
};
