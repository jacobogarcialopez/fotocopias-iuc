const express = require('express');
const { exportConsumos, exportRecargas, exportSaldos } = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Export photocopy consumes (Administrativo and Rector only)
router.get('/consumos', protect, restrictTo(4, 5), exportConsumos);

// Export recharges (Administrativo and Rector only)
router.get('/recargas', protect, restrictTo(4, 5), exportRecargas);

// Export balances of all students (Administrativo and Rector only)
router.get('/saldos', protect, restrictTo(4, 5), exportSaldos);

module.exports = router;
