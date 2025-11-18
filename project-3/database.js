const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Product Review Schema with Sentiment Analysis
const reviewSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
    trim: true
  },
  reviewer_name: {
    type: String,
    required: true,
    trim: true
  },
  review_text: {
    type: String,
    required: true
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Negative', 'Neutral'],
    required: true
  },
  sentiment_details: {
    type: String,
    default: ''
  },
  // Per-aspect analysis
  aspects: [{
    aspect: { type: String },
    sentiment: { type: String, enum: ['Positive', 'Negative', 'Neutral'] },
    confidence: { type: Number },
    context: { type: String }
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Review Model
const Review = mongoose.model('Review', reviewSchema);

module.exports = { mongoose, Review };
