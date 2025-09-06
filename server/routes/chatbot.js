const express = require('express');
const { body, validationResult } = require('express-validator');
const ChatHistory = require('../models/ChatHistory');
const Patient = require('../models/Patient');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Mock Gemini API call (replace with actual Gemini API integration)
const callGeminiAPI = async (question) => {
  // This is a mock response. Replace with actual Gemini API call
  // Example: const response = await axios.post('https://api.gemini.com/chat', { message: question });
  
  const mockResponses = [
    "I understand your concern. Based on your symptoms, I recommend consulting with a healthcare professional for proper diagnosis and treatment.",
    "Thank you for your question. While I can provide general information, it's important to discuss your specific situation with your doctor.",
    "Your symptoms could be related to various conditions. I suggest scheduling an appointment with your healthcare provider for a thorough evaluation.",
    "This is a common concern. However, for accurate diagnosis and treatment recommendations, please consult with a medical professional.",
    "I appreciate you sharing this information. For personalized medical advice, it's best to speak directly with your doctor or healthcare team."
  ];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
};

// Get chat history for a patient
router.get('/history', auth, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const chatHistory = await ChatHistory.findOne({ patientId: patient._id });
    
    res.json({
      messages: chatHistory ? chatHistory.messages : []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message to chatbot
router.post('/', auth, authorize('patient'), [
  body('question').notEmpty().withMessage('Question is required').isLength({ max: 1000 }).withMessage('Question too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question } = req.body;

    // Get patient
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Call Gemini API
    let botResponse;
    try {
      botResponse = await callGeminiAPI(question);
    } catch (apiError) {
      console.error('Gemini API Error:', apiError);
      botResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact your healthcare provider directly.";
    }

    // Find or create chat history
    let chatHistory = await ChatHistory.findOne({ patientId: patient._id });
    
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        patientId: patient._id,
        messages: []
      });
    }

    // Add patient message and bot response
    chatHistory.messages.push({
      role: 'patient',
      content: question,
      timestamp: new Date()
    });

    chatHistory.messages.push({
      role: 'bot',
      content: botResponse,
      timestamp: new Date()
    });

    await chatHistory.save();

    res.json({
      botResponse,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear chat history
router.delete('/history', auth, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    await ChatHistory.findOneAndDelete({ patientId: patient._id });
    
    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;