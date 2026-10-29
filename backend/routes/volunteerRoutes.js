const express = require('express');
const router = express.Router();
const {
  getVolunteers,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer
} = require('../controllers/volunteerController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getVolunteers);
router.post('/', protect, createVolunteer);
router.put('/:id', protect, authorize('admin', 'responder'), updateVolunteer);
router.delete('/:id', protect, authorize('admin'), deleteVolunteer);

module.exports = router;
