const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null indicates broadcast / system-wide
    },
    targetRole: {
      type: String,
      enum: ['all', 'citizen', 'responder', 'admin'],
      default: 'all'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['emergency', 'status_update', 'shelter', 'volunteer', 'general'],
      default: 'general'
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
