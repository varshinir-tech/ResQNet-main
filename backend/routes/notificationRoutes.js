const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/mark-all-read', protect, markAllAsRead);

module.exports = router;
