const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      required: [true, 'Please provide donor name'],
      trim: true,
      default: 'Anonymous Donor'
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    donorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    donorPhone: {
      type: String,
      trim: true,
      default: ''
    },
    donationType: {
      type: String,
      required: [true, 'Please select donation type'],
      enum: ['Monetary', 'Material / Relief Supplies', 'Food & Ration', 'Medical Kits', 'Clothing'],
      default: 'Monetary'
    },
    amount: {
      type: Number,
      default: 0
    },
    itemsDescription: {
      type: String,
      default: ''
    },
    purpose: {
      type: String,
      required: [true, 'Please specify purpose or target disaster area'],
      default: 'Mangaluru Flood & Landslide Relief'
    },
    donationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Pledged', 'Received', 'Distributed'],
      default: 'Received'
    },
    administrativeNotes: {
      type: String,
      default: 'Recorded for project demonstration purposes. No live financial transaction processed.'
    },
    isDemoData: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Donation', donationSchema);
