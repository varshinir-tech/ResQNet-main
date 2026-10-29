const Donation = require('../models/Donation');
const { emitEvent } = require('../utils/socketNotifier');

// @desc    Get all donations
// @route   GET /api/donations
// @access  Private (Admin can view all; Citizens can view public summary)
exports.getDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find().sort({ donationDate: -1 });

    const totalMonetary = donations
      .filter((d) => d.donationType === 'Monetary')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalSuppliesCount = donations.filter((d) => d.donationType !== 'Monetary').length;

    // Sanitize for citizens if needed (hide donor email and phone if anonymous)
    const sanitized = donations.map((d) => {
      const obj = d.toObject();
      if (d.isAnonymous && (!req.user || req.user.role !== 'admin')) {
        obj.donorName = 'Anonymous Donor';
        delete obj.donorEmail;
        delete obj.donorPhone;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: donations.length,
      totals: {
        totalMonetary,
        totalSuppliesCount
      },
      data: sanitized
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new donation (Demonstration record)
// @route   POST /api/donations
// @access  Public / Private
exports.createDonation = async (req, res, next) => {
  try {
    const {
      donorName,
      isAnonymous,
      donorEmail,
      donorPhone,
      donationType,
      amount,
      itemsDescription,
      purpose,
      status
    } = req.body;

    if (donationType === 'Monetary' || !donationType) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid donation amount. Monetary donations must have a positive amount greater than 0.'
        });
      }
    }

    const donation = await Donation.create({
      donorName: isAnonymous ? 'Anonymous Donor' : (donorName || 'Generous Citizen'),
      isAnonymous: Boolean(isAnonymous),
      donorEmail: donorEmail || '',
      donorPhone: donorPhone || '',
      donationType: donationType || 'Monetary',
      amount: donationType === 'Monetary' || !donationType ? (parseFloat(amount) || 0) : 0,
      itemsDescription: itemsDescription || '',
      purpose: purpose || 'Mangaluru Flood & Landslide Relief',
      status: status || 'Received',
      isDemoData: true
    });

    emitEvent('donation_updated', { type: 'created', donation });

    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully (Demo Record). Thank you for your support!',
      data: donation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donation status (Admin)
// @route   PUT /api/donations/:id
// @access  Private (Admin)
exports.updateDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found' });
    }
    emitEvent('donation_updated', { type: 'updated', donation });
    res.status(200).json({ success: true, message: 'Donation updated', data: donation });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete donation (Admin)
// @route   DELETE /api/donations/:id
// @access  Private (Admin)
exports.deleteDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found' });
    }
    await donation.deleteOne();
    emitEvent('donation_updated', { type: 'deleted', donationId: req.params.id });
    res.status(200).json({ success: true, message: 'Donation deleted successfully' });
  } catch (error) {
    next(error);
  }
};
