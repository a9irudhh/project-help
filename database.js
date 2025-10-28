const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://starwindow170_db_user:54mrsYHshuJoZELR@cluster0.uzadgqo.mongodb.net/feedback_system?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  customer_name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: null
  },
  feedback_text: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Feedback Model
const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = { mongoose, Feedback };
