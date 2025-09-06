const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  approvedByDoctor: {
    type: Boolean,
    default: false
  },
  completedByDoctor: {
    type: Boolean,
    default: false
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  prescription: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    instructions: String
  },
  followUpDate: {
    type: Date
  },
  slotUnavailable: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);