const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Review } = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Function to analyze sentiment using Gemini API
async function analyzeSentiment(reviewText) {
  try {
    // Using Gemini 2.0 Flash Experimental
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `Analyze the following product review and determine if the sentiment is Positive, Negative, or Neutral. 
This review is specifically about a product. Focus only on the sentiment towards the product itself.

Review: "${reviewText}"

Please respond in the following format:
SENTIMENT: [Positive/Negative/Neutral]
CONFIDENCE: [percentage from 0-100, e.g., 85]
REASON: [Brief explanation in one sentence]

Guidelines:
- Positive: Customer is satisfied with the product
- Negative: Customer is dissatisfied with the product
- Neutral: Mixed feelings, factual description, or unclear sentiment
- Confidence should reflect how certain you are about the sentiment (0-100)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response
    const sentimentMatch = text.match(/SENTIMENT:\s*(Positive|Negative|Neutral)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
    const reasonMatch = text.match(/REASON:\s*(.+)/i);
    
    const sentiment = sentimentMatch ? sentimentMatch[1] : 'Neutral';
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
    const reason = reasonMatch ? reasonMatch[1].trim() : 'Unable to determine specific reason';
    
    return {
      sentiment: sentiment,
      confidence: confidence,
      details: reason
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw new Error('Failed to analyze sentiment');
  }
}// Routes

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Submit product review and analyze sentiment
app.post('/api/analyze-review', async (req, res) => {
  const { product_name, reviewer_name, review_text } = req.body;

  // Validate input
  if (!product_name || !reviewer_name || !review_text) {
    return res.status(400).json({ 
      success: false, 
      message: 'Product name, reviewer name, and review text are required' 
    });
  }

  try {
    // Analyze sentiment using Gemini AI
    const sentimentResult = await analyzeSentiment(review_text);
    
    // Create new review document with sentiment
    const review = new Review({
      product_name,
      reviewer_name,
      review_text,
      sentiment: sentimentResult.sentiment,
      sentiment_details: sentimentResult.details
    });

    // Save to database
    await review.save();

    res.status(201).json({ 
      success: true, 
      message: 'Review analyzed and saved successfully',
      data: {
        id: review._id,
        sentiment: sentimentResult.sentiment,
        confidence: sentimentResult.confidence,
        details: sentimentResult.details
      }
    });
  } catch (error) {
    console.error('Error processing review:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error analyzing review: ' + error.message 
    });
  }
});

// API: Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ created_at: -1 });
    
    res.json({ 
      success: true, 
      data: reviews 
    });
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching reviews' 
    });
  }
});

// API: Get review by ID
app.get('/api/reviews/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    res.json({ 
      success: true, 
      data: review 
    });
  } catch (error) {
    console.error('Error fetching review:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching review' 
    });
  }
});

// API: Get sentiment statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const total = await Review.countDocuments();
    const positive = await Review.countDocuments({ sentiment: 'Positive' });
    const negative = await Review.countDocuments({ sentiment: 'Negative' });
    const neutral = await Review.countDocuments({ sentiment: 'Neutral' });

    res.json({ 
      success: true, 
      data: {
        total,
        positive,
        negative,
        neutral,
        positivePercentage: total > 0 ? ((positive / total) * 100).toFixed(1) : 0,
        negativePercentage: total > 0 ? ((negative / total) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Sentiment Analysis System ready!`);
});
