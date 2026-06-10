const express = require('express');
const { body } = require('express-validator');
const { createConsume, getConsumes } = require('../controllers/consumeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateFields } = require('../middleware/validationMiddleware');

const router = express.Router();

// Register a new consumption (Operador only)
router.post('/', [
  protect,
  restrictTo(3), // Operador
  body('cantidad_copias').isInt({ min: 1 }).withMessage('La cantidad de copias debe ser un número entero mayor o igual a 1.'),
  validateFields
], createConsume);

// Get all consumes (Operador, Administrativo, and Rector only)
router.get('/', protect, restrictTo(3, 4, 5), getConsumes);

module.exports = router;
