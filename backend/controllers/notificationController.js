const Notification = require('../models/Notification');

// @desc    Get user/system notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    // Fetch notifications directed to this user, their role, or 'all'
    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { targetRole: 'all' },
        { targetRole: role }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear / Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { recipient: req.user._id },
          { targetRole: 'all' },
          { targetRole: req.user.role }
        ]
      },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
