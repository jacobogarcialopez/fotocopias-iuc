const express = require('express');
const { body } = require('express-validator');
const { 
  getUsuarios, createUsuario, updateUsuario, deleteUsuario, 
  getAuditorias, getConfig, updateConfig 
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

const router = express.Router();

// CRUD Users (Administrativo and Rector only)
router.get('/usuarios', protect, restrictTo(4, 5), getUsuarios);

router.post('/usuarios', [
  protect,
  restrictTo(4, 5),
  body('nombre').notEmpty().withMessage('El nombre es requerido.'),
  body('apellido').notEmpty().withMessage('El apellido es requerido.'),
  body('correo').isEmail().withMessage('Debe ser un correo institucional válido.'),
  body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres.'),
  body('rol_id').isInt().withMessage('El rol es requerido.'),
  validateFields
], createUsuario);

router.put('/usuarios/:id', [
  protect,
  restrictTo(4, 5),
  body('correo').optional().isEmail().withMessage('Debe ser un correo institucional válido.'),
  body('contrasena').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres.'),
  validateFields
], updateUsuario);

router.delete('/usuarios/:id', protect, restrictTo(4, 5), deleteUsuario);

// Audit logs (Administrativo and Rector only)
router.get('/auditoria', protect, restrictTo(4, 5), getAuditorias);

// System Config
// Get configs (Operador, Administrativo, Rector can query)
router.get('/config', protect, restrictTo(3, 4, 5), getConfig);

// Update configs (Rector only)
router.put('/config', protect, restrictTo(5), updateConfig);

module.exports = router;
