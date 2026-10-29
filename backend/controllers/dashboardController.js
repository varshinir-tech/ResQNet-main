const Incident = require('../models/Incident');
const Shelter = require('../models/Shelter');
const Volunteer = require('../models/Volunteer');
const Donation = require('../models/Donation');
const User = require('../models/User');

// @desc    Get aggregated dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private (Admin, Responder, Citizen view)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalIncidents,
      activeEmergencies,
      awaitingAcknowledgment,
      resolvedIncidents,
      respondersCount,
      activeVolunteers,
      shelters,
      donations
    ] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({
        status: { $in: ['Reported', 'Acknowledged', 'Responder Assigned', 'Rescue in Progress'] }
      }),
      Incident.countDocuments({ status: 'Reported' }),
      Incident.countDocuments({ status: 'Resolved' }),
      User.countDocuments({ role: 'responder' }),
      Volunteer.countDocuments({ status: 'Active' }),
      Shelter.find(),
      Donation.find()
    ]);

    // Calculate shelter capacities
    let totalShelterCapacity = 0;
    let totalShelterOccupancy = 0;
    shelters.forEach((s) => {
      totalShelterCapacity += s.capacity || 0;
      totalShelterOccupancy += s.occupancy || 0;
    });
    const availableShelterSpaces = Math.max(0, totalShelterCapacity - totalShelterOccupancy);

    // Calculate donation aggregates
    const totalDonationAmount = donations
      .filter((d) => d.donationType === 'Monetary')
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const totalSuppliesCount = donations
      .filter((d) => d.donationType !== 'Monetary')
      .length;

    // Status distribution
    const statusDistribution = await Incident.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Category distribution
    const categoryDistribution = await Incident.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Severity distribution
    const severityDistribution = await Incident.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Recent 5 incidents
    const recentIncidents = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'name');

    res.status(200).json({
      success: true,
      data: {
        totalIncidents,
        activeEmergencies,
        awaitingAcknowledgment,
        resolvedIncidents,
        respondersCount,
        activeVolunteers,
        totalSheltersCount: shelters.length,
        totalShelterCapacity,
        totalShelterOccupancy,
        availableShelterSpaces,
        totalDonationAmount,
        totalSuppliesCount,
        statusDistribution,
        categoryDistribution,
        severityDistribution,
        recentIncidents
      }
    });
  } catch (error) {
    next(error);
  }
};
