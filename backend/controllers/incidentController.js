const Incident = require('../models/Incident');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitEvent } = require('../utils/socketNotifier');

// @desc    Get all incidents (with filters for status, category, severity)
// @route   GET /api/incidents
// @access  Public / Private (Admin sees all, Citizens can view public summary or their own)
exports.getIncidents = async (req, res, next) => {
  try {
    const { status, category, severity, myOnly } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (severity) query.severity = severity;

    // If citizen requests only their incidents
    if (myOnly === 'true' && req.user) {
      query.reportedBy = req.user.id;
    } else if (req.user && req.user.role === 'responder') {
      // If responder, show assigned or all
      if (req.query.assignedOnly === 'true') {
        query.assignedResponder = req.user.id;
      }
    }

    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email phone')
      .populate('assignedResponder', 'name email phone skills areaOfOperation');

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single incident by ID
// @route   GET /api/incidents/:id
// @access  Public (or Private)
exports.getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('assignedResponder', 'name email phone skills areaOfOperation');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    const incidentObj = incident.toObject();
    if (req.user && req.user.role === 'citizen') {
      const isReporter = incident.reportedBy && incident.reportedBy._id.toString() === req.user.id;
      if (!isReporter && incidentObj.reportedBy) {
        // Redact other citizen's private phone and email
        delete incidentObj.reportedBy.phone;
        delete incidentObj.reportedBy.email;
        incidentObj.contactPhone = 'Protected';
      }
    }

    res.status(200).json({
      success: true,
      data: incidentObj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Emergency Incident (SOS)
// @route   POST /api/incidents
// @access  Private (Citizen, Responder, Admin)
exports.createIncident = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      address,
      latitude,
      longitude,
      contactPhone
    } = req.body;

    let parsedLat = latitude !== undefined && latitude !== null ? parseFloat(latitude) : 12.9141;
    let parsedLng = longitude !== undefined && longitude !== null ? parseFloat(longitude) : 74.8560;

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude. Must be a valid number between -90 and 90.'
      });
    }

    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude. Must be a valid number between -180 and 180.'
      });
    }

    const incident = await Incident.create({
      title,
      description,
      category,
      severity: severity || 'Medium',
      status: 'Reported',
      location: {
        address: address || 'Mangaluru, Karnataka',
        latitude: parsedLat,
        longitude: parsedLng
      },
      reportedBy: req.user._id,
      reporterName: req.user.name,
      contactPhone: contactPhone || req.user.phone || 'Not provided',
      statusHistory: [
        {
          status: 'Reported',
          changedBy: req.user._id,
          changedByName: req.user.name,
          comment: 'Incident reported by citizen/user.'
        }
      ]
    });

    // Create system notification
    const notification = await Notification.create({
      targetRole: 'admin',
      title: `🚨 Emergency Reported: ${incident.title}`,
      message: `New ${incident.category} reported at ${incident.location.address}. Severity: ${incident.severity}`,
      type: 'emergency',
      incidentId: incident._id
    });

    // Real-time broadcast to admin and responders
    emitEvent('incident_created', { incident, notification });

    res.status(201).json({
      success: true,
      message: 'Emergency incident reported successfully. Help is being mobilized.',
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update incident status (Acknowledge, Assign, In Progress, Resolve)
// @route   PUT /api/incidents/:id/status
// @access  Private (Admin or Assigned Responder)
exports.updateIncidentStatus = async (req, res, next) => {
  try {
    const { status, comment, assignedResponderId } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Role verification: Responder can only update their assigned incidents
    if (req.user.role === 'responder') {
      if (!incident.assignedResponder || incident.assignedResponder.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'As a responder, you can only update incidents assigned to you.'
        });
      }
    }

    const allowedStatuses = [
      'Reported',
      'Acknowledged',
      'Responder Assigned',
      'Rescue in Progress',
      'Resolved'
    ];

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid incident status: '${status}'. Allowed statuses: ${allowedStatuses.join(', ')}`
        });
      }
      incident.status = status;
    }

    // Assign responder if provided (Admin only)
    if (assignedResponderId) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators are authorized to assign responders to incidents.'
        });
      }
      const responder = await User.findById(assignedResponderId);
      if (!responder || responder.role !== 'responder') {
        return res.status(400).json({
          success: false,
          message: 'Invalid responder ID. Assigned user must exist and have responder role.'
        });
      }
      incident.assignedResponder = responder._id;
      incident.assignedResponderName = responder.name;
      if (incident.status === 'Reported' || incident.status === 'Acknowledged') {
        incident.status = 'Responder Assigned';
      }
    }

    // Append to status history
    incident.statusHistory.push({
      status: incident.status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      comment: comment || `Status updated to ${incident.status}`
    });

    await incident.save();

    // Populate for response & broadcast
    await incident.populate('reportedBy', 'name email phone');
    await incident.populate('assignedResponder', 'name email phone');

    // Create notification
    const notification = await Notification.create({
      recipient: incident.reportedBy ? incident.reportedBy._id : null,
      targetRole: 'all',
      title: `Incident Update: ${incident.title}`,
      message: `Status updated to '${incident.status}'. Note: ${comment || 'In progress'}`,
      type: 'status_update',
      incidentId: incident._id
    });

    emitEvent('incident_updated', { incident, notification });

    res.status(200).json({
      success: true,
      message: `Incident status updated to ${incident.status}`,
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete incident (Admin only)
// @route   DELETE /api/incidents/:id
// @access  Private (Admin)
exports.deleteIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    await incident.deleteOne();
    emitEvent('incident_deleted', { incidentId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Incident record removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
