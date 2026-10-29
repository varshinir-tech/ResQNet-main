const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all responders for incident assignment
// @route   GET /api/users/responders
// @access  Private (Admin, Responder)
router.get('/responders', protect, async (req, res, next) => {
  try {
    const responders = await User.find({ role: 'responder' }).select('-password');
    res.status(200).json({ success: true, count: responders.length, data: responders });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
