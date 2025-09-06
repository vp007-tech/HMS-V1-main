const express = require('express');
const { body, validationResult } = require('express-validator');
const Billing = require('../models/Billing');
const Patient = require('../models/Patient');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  return `INV-${timestamp}`;
};

// Get all bills (role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) {
        query.patientId = patient._id;
      }
    }

    const bills = await Billing.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      })
      .populate('appointmentId')
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new bill
router.post('/', auth, authorize('admin', 'doctor'), [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('services').isArray().withMessage('Services must be an array'),
  body('services.*.description').notEmpty().withMessage('Service description is required'),
  body('services.*.quantity').isNumeric().withMessage('Quantity must be a number'),
  body('services.*.unitPrice').isNumeric().withMessage('Unit price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, appointmentId, services, tax = 0, discount = 0 } = req.body;

    // Calculate totals
    const servicesWithTotals = services.map(service => ({
      ...service,
      totalPrice: service.quantity * service.unitPrice
    }));

    const subtotal = servicesWithTotals.reduce((sum, service) => sum + service.totalPrice, 0);
    const totalAmount = subtotal + tax - discount;

    // Set due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const bill = new Billing({
      patientId,
      appointmentId,
      invoiceNumber: generateInvoiceNumber(),
      services: servicesWithTotals,
      subtotal,
      tax,
      discount,
      totalAmount,
      dueDate
    });

    await bill.save();

    const populatedBill = await Billing.findById(bill._id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      })
      .populate('appointmentId');

    res.status(201).json(populatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bill payment status
router.put('/:id/payment', auth, authorize('admin'), [
  body('status').isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Valid status is required'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'insurance', 'online']).withMessage('Valid payment method is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, paymentMethod } = req.body;
    const updateData = { status };

    if (status === 'paid') {
      updateData.paymentDate = new Date();
      updateData.paymentMethod = paymentMethod;
    }

    const updatedBill = await Billing.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      })
      .populate('appointmentId');

    if (!updatedBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(updatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bill by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email contactNumber' }
      })
      .populate('appointmentId');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Check authorization for patients
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || bill.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const multer = require('multer');
const path = require('path');

// Multer config for PDF upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../cover'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
}});

// Patient uploads payment proof (PDF)
router.post('/:id/payment-proof', auth, authorize('patient'), upload.single('paymentProof'), async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    bill.paymentProof = `/cover/${req.file.filename}`;
    await bill.save();
    res.json({ message: 'Payment proof uploaded', paymentProof: bill.paymentProof });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor verifies payment
router.put('/:id/verify-payment', auth, authorize('doctor'), async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    if (!bill.paymentProof) {
      return res.status(400).json({ message: 'No payment proof uploaded' });
    }
    bill.verifiedByDoctor = true;
    await bill.save();
    res.json({ message: 'Payment verified by doctor', bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;