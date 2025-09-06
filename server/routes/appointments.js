const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all appointments (role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) {
        query.patientId = patient._id;
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) {
        query.doctorId = doctor._id;
      }
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      })
      .sort({ date: -1, time: -1 });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new appointment
router.post('/', auth, [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctorId, date, time, reason, notes } = req.body;

    // Get patient ID
    let patientId;
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient) {
        return res.status(400).json({ message: 'Patient profile not found' });
      }
      patientId = patient._id;
    } else if (req.user.role === 'admin' && req.body.patientId) {
      patientId = req.body.patientId;
    } else {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check for conflicting appointments
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $in: ['scheduled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      date: new Date(date),
      time,
      reason,
      notes
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      });

    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment
router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      });

    res.json(updatedAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor approves/rejects appointment
router.put('/:id/approve', auth, authorize('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Appointment already processed' });
    }
    appointment.status = req.body.approve ? 'approved' : 'rejected';
    appointment.approvedByDoctor = !!req.body.approve;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor marks appointment as completed
router.put('/:id/complete', auth, authorize('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.status !== 'approved' && appointment.status !== 'scheduled') {
      return res.status(400).json({ message: 'Appointment not in correct state to complete' });
    }
    appointment.status = 'completed';
    appointment.completedByDoctor = true;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;