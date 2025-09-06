const express = require('express');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all patients (Admin and Doctor only)
router.get('/', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('userId', 'name email contactNumber')
      .sort({ createdAt: -1 });

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'name email contactNumber');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && patient.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient profile
router.put('/:id', auth, [
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood group is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && patient.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('userId', 'name email contactNumber');

    res.json(updatedPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search patients by name or email (Admin and Doctor only)
router.get('/search/:query', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { query } = req.params;
    
    const users = await User.find({
      role: 'patient',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('_id');

    const userIds = users.map(user => user._id);
    
    const patients = await Patient.find({ userId: { $in: userIds } })
      .populate('userId', 'name email contactNumber')
      .sort({ createdAt: -1 });

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;