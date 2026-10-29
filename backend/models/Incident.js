const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an incident title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide an incident description'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select an emergency category'],
      enum: [
        'Flood',
        'Landslide',
        'Fire',
        'Heavy rainfall',
        'Medical emergency',
        'Accident',
        'Other emergency'
      ]
    },
    severity: {
      type: String,
      required: [true, 'Please select severity level'],
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: [
        'Reported',
        'Acknowledged',
        'Responder Assigned',
        'Rescue in Progress',
        'Resolved'
      ],
      default: 'Reported'
    },
    location: {
      address: {
        type: String,
        required: [true, 'Location address or landmark is required'],
        default: 'Mangaluru, Karnataka'
      },
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        default: 12.9141
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        default: 74.8560
      }
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reporterName: {
      type: String,
      default: 'Citizen'
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required']
    },
    assignedResponder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedResponderName: {
      type: String,
      default: ''
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        changedByName: {
          type: String,
          default: 'System'
        },
        comment: {
          type: String,
          default: ''
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isDemoData: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Incident', incidentSchema);
