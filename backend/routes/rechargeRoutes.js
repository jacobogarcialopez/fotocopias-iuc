const express = require('express');
const { body } = require('express-validator');
const { createRecharge, getRecharges, getRechargeById } = require('../controllers/rechargeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

const router = express.Router();

// Register a new recharge (Administrativo only)
router.post('/', [
  protect,
  restrictTo(4), // Administrativo
  body('codigo_estudiante').notEmpty().withMessage('El código de estudiante es requerido.'),
  body('valor').isNumeric().withMessage('El valor debe ser un número válido.')
    .custom(v => parseFloat(v) > 0).withMessage('El valor de recarga debe ser mayor a cero.'),
  validateFields
], createRecharge);

// Get all recharges (Administrativo and Rector only)
router.get('/', protect, restrictTo(4, 5), getRecharges);

// Get specific recharge details (Protected: access controlled in controller)
router.get('/:id', protect, getRechargeById);

module.exports = router;
