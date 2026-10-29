const express = require('express');
const router = express.Router();
const {
  getDonations,
  createDonation,
  updateDonation,
  deleteDonation
} = require('../controllers/donationController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getDonations);
router.post('/', protect, createDonation);
router.put('/:id', protect, authorize('admin'), updateDonation);
router.delete('/:id', protect, authorize('admin'), deleteDonation);

module.exports = router;
