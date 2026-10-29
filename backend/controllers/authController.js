const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'super_secure_jwt_dev_secret_resq_mangaluru_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    availability: user.availability,
    skills: user.skills,
    areaOfOperation: user.areaOfOperation
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userData
  });
};

// @desc    Register a user (Citizen or Responder)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address, skills, areaOfOperation } = req.body;

    // Disallow registering directly as admin from public route
    let assignedRole = role || 'citizen';
    if (assignedRole === 'admin') {
      assignedRole = 'citizen'; // Default to citizen for safety
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      phone: phone || '',
      address: address || 'Mangaluru, Karnataka',
      skills: skills || [],
      areaOfOperation: areaOfOperation || 'Mangaluru City'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      availability: req.body.availability,
      skills: req.body.skills,
      areaOfOperation: req.body.areaOfOperation
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
