const express = require('express');
const { getPerfil, getSaldo, getQR, getMovimientos } = require('../controllers/studentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Get profile (restricted to logged-in student)
router.get('/perfil', protect, restrictTo(1), getPerfil);

// Get current balance (restricted to logged-in student)
router.get('/saldo', protect, restrictTo(1), getSaldo);

// Get QR token (restricted to logged-in student)
router.get('/qr', protect, restrictTo(1), getQR);

// Get movements (student, guardian, admin, and rector can access this with proper checks in controller)
router.get('/movimientos', protect, getMovimientos);

module.exports = router;
