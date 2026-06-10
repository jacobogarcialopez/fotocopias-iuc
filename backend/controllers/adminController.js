const { User, Role, Student, Guardian, GuardianStudent, Audit, SystemConfig } = require('../models');
const { sequelize } = require('../config/database');
const { logAudit } = require('../services/auditService');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// ----------------------------------------------------
// USER CRUD OPERATIONS
// ----------------------------------------------------

const getUsuarios = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        { model: Role, as: 'rol' },
        { model: Student, as: 'estudiante' },
        { 
          model: Guardian, 
          as: 'acudiente',
          include: { model: Student, as: 'estudiantes', attributes: ['id', 'codigo_estudiante'] }
        }
      ],
      order: [['id', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de usuarios.'
    });
  }
};

const createUsuario = async (req, res) => {
  const { nombre, apellido, correo, contrasena, rol_id, estado, codigo_estudiante, telefono, estudiantes_asociados } = req.body;
  const adminId = req.user.id;

  if (!nombre || !apellido || !correo || !contrasena || !rol_id) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios: nombre, apellido, correo, contrasena y rol_id.'
    });
  }

  const transaction = await sequelize.transaction();

  try {
    // Check if email already exists
    const emailExists = await User.findOne({ where: { correo }, transaction });
    if (emailExists) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const contrasena_hash = await bcrypt.hash(contrasena, salt);

    // 1. Create User
    const user = await User.create({
      nombre,
      apellido,
      correo,
      contrasena_hash,
      rol_id: parseInt(rol_id),
      estado: estado || 'activo'
    }, { transaction });

    // 2. Create Role Profiles
    if (parseInt(rol_id) === 1) { // Estudiante
      if (!codigo_estudiante) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El código de estudiante es requerido para el rol de Estudiante.'
        });
      }

      // Check if student code exists
      const codeExists = await Student.findOne({ where: { codigo_estudiante }, transaction });
      if (codeExists) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El código de estudiante ya está en uso.'
        });
      }

      await Student.create({
        usuario_id: user.id,
        codigo_estudiante,
        saldo_actual: 0.00
      }, { transaction });

    } else if (parseInt(rol_id) === 2) { // Acudiente
      if (!telefono) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El teléfono es requerido para el rol de Acudiente.'
        });
      }

      const guardian = await Guardian.create({
        usuario_id: user.id,
        telefono
      }, { transaction });

      // Link students if provided
      if (estudiantes_asociados && Array.isArray(estudiantes_asociados)) {
        for (const studentId of estudiantes_asociados) {
          // Verify student exists
          const student = await Student.findByPk(studentId, { transaction });
          if (student) {
            await GuardianStudent.create({
              acudiente_id: guardian.id,
              estudiante_id: student.id
            }, { transaction });
          }
        }
      }
    }

    await transaction.commit();

    // Register Audit
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(adminId, `Creó usuario ${correo} (Rol: ${rol_id})`, ip);

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      data: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rolId: user.rol_id
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al crear el usuario.'
    });
  }
};

const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, correo, contrasena, rol_id, estado, codigo_estudiante, telefono, estudiantes_asociados } = req.body;
  const adminId = req.user.id;

  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // Update base fields
    if (nombre) user.nombre = nombre;
    if (apellido) user.apellido = apellido;
    if (correo) user.correo = correo;
    if (estado) user.estado = estado;
    
    // Hash password if modified
    if (contrasena) {
      const salt = await bcrypt.genSalt(10);
      user.contrasena_hash = await bcrypt.hash(contrasena, salt);
    }

    // Role cannot be changed directly in this update function for security, or we can allow it
    if (rol_id && parseInt(rol_id) !== user.rol_id) {
      user.rol_id = parseInt(rol_id);
    }

    await user.save({ transaction });

    // Update profiles
    if (user.rol_id === 1) { // Estudiante
      const student = await Student.findOne({ where: { usuario_id: user.id }, transaction });
      if (student) {
        if (codigo_estudiante) {
          student.codigo_estudiante = codigo_estudiante;
          await student.save({ transaction });
        }
      } else if (codigo_estudiante) {
        await Student.create({
          usuario_id: user.id,
          codigo_estudiante,
          saldo_actual: 0.00
        }, { transaction });
      }
    } else if (user.rol_id === 2) { // Acudiente
      let guardian = await Guardian.findOne({ where: { usuario_id: user.id }, transaction });
      if (guardian) {
        if (telefono) {
          guardian.telefono = telefono;
          await guardian.save({ transaction });
        }
      } else if (telefono) {
        guardian = await Guardian.create({
          usuario_id: user.id,
          telefono
        }, { transaction });
      }

      // Re-link students if provided
      if (guardian && estudiantes_asociados && Array.isArray(estudiantes_asociados)) {
        // Clear existing associations
        await GuardianStudent.destroy({ where: { acudiente_id: guardian.id }, transaction });
        // Add new associations
        for (const studentId of estudiantes_asociados) {
          const student = await Student.findByPk(studentId, { transaction });
          if (student) {
            await GuardianStudent.create({
              acudiente_id: guardian.id,
              estudiante_id: student.id
            }, { transaction });
          }
        }
      }
    }

    await transaction.commit();

    // Register Audit
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(adminId, `Actualizó usuario ID ${id} (${user.correo})`, ip);

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente.'
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar el usuario.'
    });
  }
};

const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  if (parseInt(id) === adminId) {
    return res.status(400).json({
      success: false,
      message: 'No puedes eliminar tu propia cuenta.'
    });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // Rules of business 8: Transactions cannot be deleted. If this user has recharges or consumes, we shouldn't allow deleting or we should set status to 'inactivo'.
    // Let's check if user is student and has recharges or consumes
    if (user.rol_id === 1) {
      const student = await Student.findOne({ where: { usuario_id: user.id } });
      if (student) {
        const countRecharges = await student.countRecargas();
        const countConsumes = await student.countConsumos();
        if (countRecharges > 0 || countConsumes > 0) {
          // Has history! Change state instead of deleting
          user.estado = 'inactivo';
          await user.save();
          
          const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
          await logAudit(adminId, `Desactivó usuario ID ${id} (${user.correo}) debido a historial de transacciones existente`, ip);

          return res.status(200).json({
            success: true,
            message: 'El usuario tiene transacciones asociadas. Se ha marcado como INACTIVO para preservar el historial.'
          });
        }
      }
    }

    const userEmail = user.correo;
    await user.destroy();

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(adminId, `Eliminó usuario ID ${id} (${userEmail})`, ip);

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado de la base de datos.'
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al eliminar el usuario.'
    });
  }
};

// ----------------------------------------------------
// AUDIT LOG
// ----------------------------------------------------

const getAuditorias = async (req, res) => {
  try {
    const logs = await Audit.findAll({
      include: {
        model: User,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'correo']
      },
      order: [['fecha', 'DESC']],
      limit: 100 // Cap to latest 100 for safety
    });

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la bitácora de auditoría.'
    });
  }
};

// ----------------------------------------------------
// SYSTEM CONFIGURATION
// ----------------------------------------------------

const getConfig = async (req, res) => {
  try {
    const configs = await SystemConfig.findAll();
    return res.status(200).json({
      success: true,
      data: configs
    });
  } catch (error) {
    logger.error('Error fetching config:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los parámetros del sistema.'
    });
  }
};

const updateConfig = async (req, res) => {
  const { configs } = req.body; // Expects array of [{ clave: 'modo_emergencia', valor: '1' }]
  const userId = req.user.id;

  if (!configs || !Array.isArray(configs)) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere una lista de configuraciones a actualizar.'
    });
  }

  const transaction = await sequelize.transaction();

  try {
    for (const conf of configs) {
      const dbConf = await SystemConfig.findOne({ where: { clave: conf.clave }, transaction });
      if (dbConf) {
        dbConf.valor = String(conf.valor);
        await dbConf.save({ transaction });
      }
    }

    await transaction.commit();

    // Register Audit
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(userId, `Actualizó parámetros del sistema: ${JSON.stringify(configs)}`, ip);

    return res.status(200).json({
      success: true,
      message: 'Parámetros del sistema actualizados correctamente.'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating config:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar la configuración.'
    });
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getAuditorias,
  getConfig,
  updateConfig
};
