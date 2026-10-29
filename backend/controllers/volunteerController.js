const Volunteer = require('../models/Volunteer');
const User = require('../models/User');
const Incident = require('../models/Incident');
const { emitEvent } = require('../utils/socketNotifier');

// @desc    Get all volunteers
// @route   GET /api/volunteers
// @access  Private (Admin can view all details; Citizen can view limited stats)
exports.getVolunteers = async (req, res, next) => {
  try {
    const { status, availability, skill } = req.query;
    let query = {};

    if (status) query.status = status;
    if (availability) query.availability = availability;
    if (skill) query.skills = { $in: [skill] };

    let volunteers;
    if (req.user && req.user.role === 'admin') {
      volunteers = await Volunteer.find(query)
        .populate('assignedIncident', 'title category status location')
        .sort({ createdAt: -1 });
    } else {
      // Citizen / Public view: sanitize private contact info
      volunteers = await Volunteer.find(query)
        .select('name skills availability areaOfOperation status isDemoData')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create volunteer record
// @route   POST /api/volunteers
// @access  Private (Admin or Citizen registering as volunteer)
exports.createVolunteer = async (req, res, next) => {
  try {
    const { name, phone, email, skills, availability, areaOfOperation } = req.body || {};

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: 'Volunteer name is required' });
    }
    if (!phone || String(phone).trim() === '') {
      return res.status(400).json({ success: false, message: 'Volunteer contact phone is required' });
    }

    const volunteerName = String(name).trim();
    const volunteerPhone = String(phone).trim();

    const volunteer = await Volunteer.create({
      name: volunteerName.trim(),
      email: email || (req.user ? req.user.email : ''),
      phone: volunteerPhone.trim(),
      skills: Array.isArray(skills) && skills.length > 0 ? skills : (skills ? [skills] : ['General Relief Support']),
      availability: availability || 'Available',
      areaOfOperation: areaOfOperation || 'Mangaluru City',
      registeredUser: req.user ? req.user._id : null
    });

    emitEvent('volunteer_updated', { type: 'created', volunteer });
    res.status(201).json({ success: true, message: 'Volunteer registered successfully', data: volunteer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update volunteer (status, availability, incident assignment)
// @route   PUT /api/volunteers/:id
// @access  Private (Admin or Self)
exports.updateVolunteer = async (req, res, next) => {
  try {
    let volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer not found' });
    }

    if (req.body.assignedIncidentId) {
      const incident = await Incident.findById(req.body.assignedIncidentId);
      if (incident) {
        volunteer.assignedIncident = incident._id;
        volunteer.assignedIncidentTitle = incident.title;
        volunteer.availability = 'On Duty';
      }
    } else if (req.body.assignedIncidentId === null || req.body.assignedIncidentId === '') {
      volunteer.assignedIncident = null;
      volunteer.assignedIncidentTitle = '';
    }

    volunteer = await Volunteer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    emitEvent('volunteer_updated', { type: 'updated', volunteer });
    res.status(200).json({ success: true, message: 'Volunteer updated successfully', data: volunteer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete volunteer
// @route   DELETE /api/volunteers/:id
// @access  Private (Admin)
exports.deleteVolunteer = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer not found' });
    }
    await volunteer.deleteOne();
    emitEvent('volunteer_updated', { type: 'deleted', volunteerId: req.params.id });
    res.status(200).json({ success: true, message: 'Volunteer record deleted' });
  } catch (error) {
    next(error);
  }
};
