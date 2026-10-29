const express = require('express');
const router = express.Router();
const {
  getShelters,
  getShelterById,
  createShelter,
  updateShelter,
  deleteShelter
} = require('../controllers/shelterController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getShelters);
router.get('/:id', getShelterById);
router.post('/', protect, authorize('admin'), createShelter);
router.put('/:id', protect, authorize('admin'), updateShelter);
router.delete('/:id', protect, authorize('admin'), deleteShelter);

module.exports = router;
