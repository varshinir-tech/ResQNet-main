const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide shelter name'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Please provide shelter address'],
      trim: true
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
    },
    capacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    occupancy: {
      type: Number,
      default: 0,
      min: [0, 'Occupancy cannot be negative'],
      validate: {
        validator: function (val) {
          const cap = this.capacity !== undefined ? this.capacity : (this.get ? this.get('capacity') : undefined);
          return cap === undefined || val <= cap;
        },
        message: 'Occupancy cannot exceed shelter capacity'
      }
    },
    facilities: {
      type: [String],
      default: ['Drinking Water', 'First Aid', 'Sanitation', 'Rest Area']
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required']
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required']
    },
    status: {
      type: String,
      enum: ['Open', 'Full', 'Closed'],
      default: 'Open'
    },
    isDemoData: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property to calculate available spaces automatically
shelterSchema.virtual('availableSpaces').get(function () {
  return Math.max(0, this.capacity - this.occupancy);
});

module.exports = mongoose.model('Shelter', shelterSchema);
