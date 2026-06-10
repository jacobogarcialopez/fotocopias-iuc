const express = require('express');
const { getAssociatedStudents, getAssociatedRecharges } = require('../controllers/guardianController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// List associated students (Acudiente only)
router.get('/estudiantes', protect, restrictTo(2), getAssociatedStudents);

// Get recharges of associated students (Acudiente only)
router.get('/recargas', protect, restrictTo(2), getAssociatedRecharges);

module.exports = router;
