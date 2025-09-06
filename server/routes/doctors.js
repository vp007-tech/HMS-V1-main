const express = require('express');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/', auth, async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('userId', 'name email contactNumber')
      .sort({ createdAt: -1 });

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email contactNumber');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update doctor profile
router.put('/:id', auth, [
  body('specialization').optional().notEmpty().withMessage('Specialization is required'),
  body('licenseNumber').optional().notEmpty().withMessage('License number is required'),
  body('experience').optional().isNumeric().withMessage('Experience must be a number'),
  body('consultationFee').optional().isNumeric().withMessage('Consultation fee must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check authorization
    if (req.user.role === 'doctor' && doctor.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('userId', 'name email contactNumber');

    res.json(updatedDoctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search doctors by specialization
router.get('/search/specialization/:specialization', auth, async (req, res) => {
  try {
    const { specialization } = req.params;
    
    const doctors = await Doctor.find({
      specialization: { $regex: specialization, $options: 'i' }
    })
      .populate('userId', 'name email contactNumber')
      .sort({ createdAt: -1 });

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's availability
router.get('/:id/availability', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('availability');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor.availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;