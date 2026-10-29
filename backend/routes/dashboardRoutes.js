const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', getDashboardStats);

module.exports = router;
