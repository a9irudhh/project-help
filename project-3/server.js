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

// ------------------- Rule-based aspect analyzer (server-side) -------------------
function analyzeAspects(reviewText) {
  const original = reviewText || '';
  let s = original.toLowerCase();
  s = s.replace(/notworking/g, 'not working');
  s = s.replace(/doesnt/g, "doesn't");
  s = s.replace(/[^a-z0-9\s'\-]/g, ' ');
  const tokens = s.split(/\s+/).filter(Boolean);

  const aspectMap = {
    battery: ['battery', 'battery life', 'battery-life', 'charge', 'charging'],
    camera: ['camera', 'cameras', 'cam'],
    screen: ['screen', 'display', 'touchscreen'],
    speaker: ['speaker', 'speakers', 'audio'],
    microphone: ['microphone', 'mic'],
    performance: ['performance', 'speed', 'fast', 'slow', 'lag', 'laggy'],
    software: ['software', 'os', 'firmware', 'app'],
    design: ['design', 'build', 'look', 'style']
  };

  const positiveWords = new Set(['good','great','excellent','amazing','awesome','fine','well','love','liked','positive','superb','perfect','nice','smooth','responsive','fast','long','longlasting','long-lasting','durable','improved']);
  const negativeWords = new Set(['bad','not','poor','terrible','awful','sucks','slow','laggy','noisy','crack','broken','failed','disappointing','faulty','issue','issues','problem','problems','wont','doesnt','doesn\'t','drain','drains','overheat','overheating','dead','die','not working','notworking','broke']);
  const negation = new Set(['not','no','never','none','n\'t']);

  const aspectRegexes = [];
  for (const [canonical, variants] of Object.entries(aspectMap)) {
    for (const v of variants) {
      const re = new RegExp('\\b' + v.replace(/[-\s]/g, '[\\s-]') + '\\b', 'i');
      aspectRegexes.push({ canonical, variant: v, re });
    }
  }

  const foundAspects = new Map();
  for (const ar of aspectRegexes) {
    const match = s.match(ar.re);
    if (match) {
      const idx = Math.max(0, s.substring(0, match.index).split(/\s+/).filter(Boolean).length);
      if (!foundAspects.has(ar.canonical)) {
        foundAspects.set(ar.canonical, { name: ar.canonical, index: idx, matches: [ar.variant] });
      } else {
        foundAspects.get(ar.canonical).matches.push(ar.variant);
      }
    }
  }

  const aspects = [];
  for (const [name, info] of foundAspects.entries()) {
    const idx = info.index;
    const start = Math.max(0, idx - 3);
    const end = Math.min(tokens.length, idx + 4);
    const contextTokens = tokens.slice(start, end);
    const context = contextTokens.join(' ');

    let pos = 0, neg = 0;
    for (const t of contextTokens) {
      if (positiveWords.has(t)) pos++;
      if (negativeWords.has(t)) neg++;
    }

    const before = tokens.slice(Math.max(0, idx - 3), idx);
    let hasNegation = before.some(t => negation.has(t) || t === 'not');

    if (/not\s+\w+/.test(context)) {
      neg += 1;
      hasNegation = true;
    }

    let sentiment = 'Neutral';
    if (pos > neg) sentiment = 'Positive';
    else if (neg > pos) sentiment = 'Negative';
    else if (hasNegation && pos > 0) sentiment = 'Negative';
    else if (hasNegation && pos === 0) sentiment = 'Negative';

    // confidence heuristic
    let confidence = 60;
    const total = pos + neg;
    if (total === 0) {
      confidence = hasNegation ? 70 : 55;
      if (sentiment === 'Neutral') confidence = 50;
    } else {
      const ratio = Math.abs(pos - neg) / total; // 0..1
      confidence = Math.round(50 + ratio * 45); // 50..95
    }

    confidence = Math.max(40, Math.min(95, confidence));

    aspects.push({ aspect: name, sentiment, confidence, context });
  }

  // derive overall sentiment from aspects
  let overall = 'Neutral';
  if (aspects.length > 0) {
    let p = 0, n = 0;
    for (const a of aspects) {
      if (a.sentiment === 'Positive') p++;
      if (a.sentiment === 'Negative') n++;
    }
    if (p > n) overall = 'Positive';
    else if (n > p) overall = 'Negative';
    else overall = 'Neutral';
  }

  return { overall, aspects };
}

// Routes

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Submit product review and analyze sentiment
app.post('/api/analyze-review', async (req, res) => {
  const { product_name, reviewer_name, review_text } = req.body;
  // Allow missing product/reviewer for quick inputs
  const product = product_name && product_name.trim() ? product_name.trim() : 'Quick Input';
  const reviewer = reviewer_name && reviewer_name.trim() ? reviewer_name.trim() : 'Anonymous';
  const text = review_text && review_text.trim() ? review_text.trim() : '';

  if (!text) {
    return res.status(400).json({ success: false, message: 'review_text is required' });
  }

  try {
    // Perform rule-based aspect analysis server-side
    const analysis = analyzeAspects(text);

    // Create new review document with aspects
    const review = new Review({
      product_name: product,
      reviewer_name: reviewer,
      review_text: text,
      sentiment: analysis.overall,
      sentiment_details: `Aspects detected: ${analysis.aspects.map(a => a.aspect).join(', ')}`,
      aspects: analysis.aspects
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Aspect analysis saved',
      data: {
        id: review._id,
        sentiment: analysis.overall,
        aspects: analysis.aspects
      }
    });
  } catch (error) {
    console.error('Error processing review:', error.message);
    res.status(500).json({ success: false, message: 'Error analyzing review: ' + error.message });
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
