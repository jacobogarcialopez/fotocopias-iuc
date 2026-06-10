const express = require('express');
const { body } = require('express-validator');
const { login, logout, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/login', [
  body('correo').isEmail().withMessage('Debe ingresar un correo institucional válido.'),
  body('contrasena').notEmpty().withMessage('La contraseña es requerida.'),
  validateFields
], login);

router.post('/forgot-password', [
  body('correo').isEmail().withMessage('Debe ingresar un correo institucional válido.'),
  validateFields
], forgotPassword);

router.post('/logout', protect, logout);

module.exports = router;
