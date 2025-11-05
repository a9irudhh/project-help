const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Feedback } = require('./database');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Simple token storage (in production, use JWT and proper session management)
const activeSessions = new Set();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized' 
    });
  }

  next();
}

// Generate simple token
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Routes

// Serve customer feedback page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'customer.html'));
});

// Serve admin login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve admin dashboard page (protected)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API: Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  // Validate credentials
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken();
    activeSessions.add(token);

    res.json({
      success: true,
      message: 'Login successful',
      token: token
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
});

// API: Submit feedback (POST)
app.post('/api/feedback', async (req, res) => {
  const { customer_name, email, feedback_text } = req.body;

  // Validate input
  if (!customer_name || !feedback_text) {
    return res.status(400).json({ 
      success: false, 
      message: 'Customer name and feedback text are required' 
    });
  }

  try {
    // Create new feedback document
    const feedback = new Feedback({
      customer_name,
      email: email || null,
      feedback_text
    });

    // Save to database
    await feedback.save();

    res.status(201).json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      id: feedback._id
    });
  } catch (error) {
    console.error('Error inserting feedback:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving feedback' 
    });
  }
});

// API: Get all feedback (GET) - for admin (protected)
app.get('/api/feedback', authMiddleware, async (req, res) => {
  try {
    // Fetch all feedback, sorted by creation date (newest first)
    const feedbackList = await Feedback.find().sort({ created_at: -1 });

    res.json({ 
      success: true, 
      data: feedbackList 
    });
  } catch (error) {
    console.error('Error fetching feedback:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching feedback' 
    });
  }
});

// API: Get single feedback by ID (protected)
app.get('/api/feedback/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found' 
      });
    }

    res.json({ 
      success: true, 
      data: feedback 
    });
  } catch (error) {
    console.error('Error fetching feedback:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching feedback' 
    });
  }
});

// API: Delete feedback (DELETE) - for admin (protected)
app.delete('/api/feedback/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Feedback.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Feedback deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting feedback:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting feedback' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Customer page: http://localhost:${PORT}`);
  console.log(`Admin login: http://localhost:${PORT}/login`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});
