const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide volunteer name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true
    },
    skills: {
      type: [String],
      required: [true, 'Please select or add at least one skill'],
      default: ['First Aid']
    },
    availability: {
      type: String,
      enum: ['Available', 'On Duty', 'Busy', 'Unavailable'],
      default: 'Available'
    },
    areaOfOperation: {
      type: String,
      required: [true, 'Please provide area of operation'],
      default: 'Mangaluru City'
    },
    assignedIncident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null
    },
    assignedIncidentTitle: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active'
    },
    registeredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isDemoData: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
