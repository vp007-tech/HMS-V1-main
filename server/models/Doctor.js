const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  experience: {
    type: Number,
    required: true
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  qualifications: [{
    type: String
  }],
  bio: {
    type: String
  },
  image: {
    type: String // file path or URL
  },
  contact: {
    email: String,
    phone: String
  },
  availability: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  consultationFee: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);