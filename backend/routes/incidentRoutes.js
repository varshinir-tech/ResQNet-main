const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  deleteIncident
} = require('../controllers/incidentController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getIncidents);
router.get('/:id', protect, getIncidentById);
router.post('/', protect, createIncident);
router.put('/:id/status', protect, authorize('admin', 'responder'), updateIncidentStatus);
router.delete('/:id', protect, authorize('admin'), deleteIncident);

module.exports = router;
