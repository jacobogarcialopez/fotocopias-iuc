const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get notifications for logged-in user
router.get('/', protect, getNotifications);

// Mark notification as read
router.put('/:id', protect, markAsRead);

module.exports = router;
