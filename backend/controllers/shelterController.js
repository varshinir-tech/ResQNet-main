const Shelter = require('../models/Shelter');
const { emitEvent } = require('../utils/socketNotifier');

// @desc    Get all shelters
// @route   GET /api/shelters
// @access  Public (or Private)
exports.getShelters = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const shelters = await Shelter.find(query).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: shelters.length,
      data: shelters
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get shelter by ID
// @route   GET /api/shelters/:id
// @access  Public
exports.getShelterById = async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ success: false, message: 'Shelter not found' });
    }
    res.status(200).json({ success: true, data: shelter });
  } catch (error) {
    next(error);
  }
};

// @desc    Create shelter
// @route   POST /api/shelters
// @access  Private (Admin)
exports.createShelter = async (req, res, next) => {
  try {
    const { capacity, occupancy } = req.body;
    if (capacity !== undefined && Number(capacity) < 1) {
      return res.status(400).json({ success: false, message: 'Capacity must be at least 1' });
    }
    if (occupancy !== undefined && Number(occupancy) < 0) {
      return res.status(400).json({ success: false, message: 'Occupancy cannot be negative' });
    }
    if (capacity !== undefined && occupancy !== undefined && Number(occupancy) > Number(capacity)) {
      return res.status(400).json({ success: false, message: 'Occupancy cannot exceed total shelter capacity' });
    }

    const shelter = await Shelter.create(req.body);
    emitEvent('shelter_updated', { type: 'created', shelter });
    res.status(201).json({ success: true, message: 'Shelter created successfully', data: shelter });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shelter
// @route   PUT /api/shelters/:id
// @access  Private (Admin)
exports.updateShelter = async (req, res, next) => {
  try {
    let shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ success: false, message: 'Shelter not found' });
    }

    const targetCapacity = req.body.capacity !== undefined ? Number(req.body.capacity) : shelter.capacity;
    const targetOccupancy = req.body.occupancy !== undefined ? Number(req.body.occupancy) : shelter.occupancy;

    if (targetCapacity < 1) {
      return res.status(400).json({ success: false, message: 'Capacity must be at least 1' });
    }
    if (targetOccupancy < 0) {
      return res.status(400).json({ success: false, message: 'Occupancy cannot be negative' });
    }
    if (targetOccupancy > targetCapacity) {
      return res.status(400).json({ success: false, message: 'Occupancy cannot exceed total shelter capacity' });
    }

    // Auto-update status to Full if occupancy equals or exceeds capacity
    if (targetOccupancy >= targetCapacity) {
      req.body.status = 'Full';
    } else if (req.body.status === 'Full' && targetOccupancy < targetCapacity) {
      req.body.status = 'Open';
    }

    shelter = await Shelter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    emitEvent('shelter_updated', { type: 'updated', shelter });
    res.status(200).json({ success: true, message: 'Shelter updated successfully', data: shelter });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete shelter
// @route   DELETE /api/shelters/:id
// @access  Private (Admin)
exports.deleteShelter = async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ success: false, message: 'Shelter not found' });
    }
    await shelter.deleteOne();
    emitEvent('shelter_updated', { type: 'deleted', shelterId: req.params.id });
    res.status(200).json({ success: true, message: 'Shelter deleted successfully' });
  } catch (error) {
    next(error);
  }
};
