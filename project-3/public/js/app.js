// API Base URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements (guard for removed form)
const reviewForm = document.getElementById('reviewForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
const loader = submitBtn ? submitBtn.querySelector('.loader') : null;
const resultsSection = document.getElementById('resultsSection');
const newReviewBtn = document.getElementById('newReviewBtn');
// Quick analyzer DOM elements (single-line input)
const quickSentence = document.getElementById('quickSentence');
const quickAnalyzeBtn = document.getElementById('quickAnalyzeBtn');
const quickResults = document.getElementById('quickResults');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadRecentReviews();
    // wire quick analyzer: send sentence to server to analyze and persist
    if (quickAnalyzeBtn) {
        quickAnalyzeBtn.addEventListener('click', async () => {
            const sentence = (quickSentence && quickSentence.value) ? quickSentence.value.trim() : '';
            if (!sentence) {
                quickResults.innerHTML = '<div class="hint">Please enter a sentence to analyze.</div>';
                return;
            }

            quickResults.innerHTML = '<div class="hint">Analyzing...</div>';
            try {
                // include defaults so older server instances (not restarted) still accept the request
                const payload = { review_text: sentence, product_name: 'Quick Input', reviewer_name: 'Anonymous' };
                const resp = await fetch(`${API_URL}/analyze-review`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await resp.json();
                if (data && data.success) {
                    // render quick results (aspects + sentiment + confidence)
                    renderQuickResults(sentence, { aspects: data.data.aspects || [] });

                    // also populate the main results card with overall + per-aspect breakdown
                    if (resultsSection) {
                        // show results area
                        document.querySelector('.quick-analyzer').style.display = 'none';
                        resultsSection.style.display = 'block';
                        displayResultsWithAspects({ product_name: data.data.product_name || 'Quick Input', reviewer_name: data.data.reviewer_name || 'Anonymous', review_text: sentence }, { sentiment: data.data.sentiment, aspects: data.data.aspects });
                    }

                    // refresh stats/recent reviews
                    loadStatistics();
                    loadRecentReviews();
                } else {
                    quickResults.innerHTML = `<div class="hint">Error: ${escapeHtml(data.message || 'Server error')}</div>`;
                }
            } catch (err) {
                console.error(err);
                quickResults.innerHTML = '<div class="hint">Failed to analyze. Is the server running?</div>';
            }
        });
    }
});

// Handle form submission (only if full form exists)
if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        product_name: document.getElementById('productName').value,
        reviewer_name: document.getElementById('reviewerName').value,
        review_text: document.getElementById('reviewText').value
    };
    
    // Disable form and show loader
    setFormLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/analyze-review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();

        if (result.success) {
            // Display results (now includes per-aspect data)
            displayResultsWithAspects(formData, result.data);

            // Refresh statistics and recent reviews
            loadStatistics();
            loadRecentReviews();

            // Hide form, show results
            document.querySelector('.form-section').style.display = 'none';
            resultsSection.style.display = 'block';
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to analyze review. Please check if the server is running.');
    } finally {
        setFormLoading(false);
    }
    });
}

// Handle new review button (if present)
if (newReviewBtn) {
    newReviewBtn.addEventListener('click', () => {
        if (reviewForm) reviewForm.reset();
        // Show form, hide results
        const formSection = document.querySelector('.form-section');
        if (formSection) formSection.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
    });
}

// Display sentiment analysis results
function displayResultsWithAspects(formData, resultData) {
    const { sentiment, aspects } = resultData;

    // Update sentiment badge (overall)
    const sentimentBadge = document.getElementById('sentimentBadge');
    sentimentBadge.textContent = sentiment;
    sentimentBadge.className = 'sentiment-badge ' + (sentiment ? sentiment.toLowerCase() : 'neutral');

    // compute average confidence
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceValue = document.getElementById('confidenceValue');
    let avgConfidence = 0;
    if (aspects && aspects.length > 0) {
        avgConfidence = Math.round(aspects.reduce((s, a) => s + (a.confidence || 0), 0) / aspects.length);
    }
    confidenceBar.style.width = (avgConfidence || 0) + '%';
    confidenceBar.className = 'confidence-bar ' + (sentiment ? sentiment.toLowerCase() : 'neutral');
    confidenceValue.textContent = (avgConfidence || 0) + '%';

    // Update sentiment details area with per-aspect breakdown
    const detailsEl = document.getElementById('sentimentDetails');
    if (aspects && aspects.length > 0) {
        detailsEl.innerHTML = aspects.map(a => `<div><strong>${escapeHtml(a.aspect)}</strong>: ${escapeHtml(a.sentiment)} (${a.confidence}%)</div>`).join('');
    } else {
        detailsEl.textContent = 'No aspects detected.';
    }

    // Update review summary
    document.getElementById('resultProduct').textContent = formData.product_name || '';
    document.getElementById('resultReviewer').textContent = formData.reviewer_name || '';
    document.getElementById('resultReview').textContent = formData.review_text || '';
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        const result = await response.json();
        
        if (result.success) {
            const { total, positive, negative, neutral } = result.data;
            
            document.getElementById('totalReviews').textContent = total;
            document.getElementById('positiveReviews').textContent = positive;
            document.getElementById('negativeReviews').textContent = negative;
            document.getElementById('neutralReviews').textContent = neutral || 0;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load recent reviews
async function loadRecentReviews() {
    try {
        const response = await fetch(`${API_URL}/reviews`);
        const result = await response.json();
        
        if (result.success) {
            displayRecentReviews(result.data);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Display recent reviews
function displayRecentReviews(reviews) {
    const reviewsList = document.getElementById('recentReviewsList');
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to submit a review!</div>';
        return;
    }
    
    // Show only the 5 most recent reviews
    const recentReviews = reviews.slice(0, 5);
    
    reviewsList.innerHTML = recentReviews.map(review => {
        const date = new Date(review.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="review-item ${review.sentiment.toLowerCase()}">
                <div class="review-header">
                    <div class="review-info">
                        <h4>${escapeHtml(review.product_name)}</h4>
                        <p>by ${escapeHtml(review.reviewer_name)}</p>
                    </div>
                    <span class="review-sentiment ${review.sentiment.toLowerCase()}">
                        ${review.sentiment}
                    </span>
                </div>
                <p class="review-text">${escapeHtml(truncateText(review.review_text, 150))}</p>
                <p class="review-date">${date}</p>
            </div>
        `;
    }).join('');
}

// Helper function to set form loading state
function setFormLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;

    if (isLoading) {
        if (btnText) btnText.style.display = 'none';
        if (loader) loader.style.display = 'block';
    } else {
        if (btnText) btnText.style.display = 'block';
        if (loader) loader.style.display = 'none';
    }
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --------------------- Quick Aspect Analyzer ---------------------
// Simple rule-based aspect detection and sentiment per-aspect
function analyzeSentence(sentence) {
    const original = sentence || '';
    let s = original.toLowerCase();
    // fix common concatenations (e.g., notworking)
    s = s.replace(/notworking/g, 'not working');
    s = s.replace(/doesnt/g, "doesn't");
    // remove excessive punctuation but keep apostrophes
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

    // build reverse lookup for regex matching
    const aspectRegexes = [];
    for (const [canonical, variants] of Object.entries(aspectMap)) {
        for (const v of variants) {
            const re = new RegExp('\\b' + v.replace(/[-\s]/g, '[\\s-]') + '\\b', 'i');
            aspectRegexes.push({ canonical, variant: v, re });
        }
    }

    // find matches with token indexes
    const foundAspects = new Map();
    for (const ar of aspectRegexes) {
        const match = s.match(ar.re);
        if (match) {
            // find approximate token index
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
        // context window size
        const start = Math.max(0, idx - 3);
        const end = Math.min(tokens.length, idx + 4);
        const contextTokens = tokens.slice(start, end);

        // join context for phrase checks
        const context = contextTokens.join(' ');

        // count positive / negative
        let pos = 0, neg = 0;
        for (const t of contextTokens) {
            if (positiveWords.has(t)) pos++;
            if (negativeWords.has(t)) neg++;
        }

        // detect negation near aspect (within 3 tokens before)
        const before = tokens.slice(Math.max(0, idx - 3), idx);
        let hasNegation = before.some(t => negation.has(t) || t === 'not');

        // special handling: phrases like 'not working' or 'not good'
        if (/not\s+\w+/.test(context)) {
            // increase negative weight when 'not X' exists in context
            neg += 1;
            hasNegation = true;
        }

        // decide sentiment
        let sentiment = 'neutral';
        if (pos > neg) sentiment = 'positive';
        else if (neg > pos) sentiment = 'negative';
        else if (hasNegation && pos > 0) sentiment = 'negative';
        else if (hasNegation && pos === 0) sentiment = 'negative';

        aspects.push({ name, sentiment, context: context, pos, neg, hasNegation });
    }

    return { sentence: original, aspects };
}

function renderQuickResults(sentence, analysis) {
    if (!quickResults) return;
    const { aspects } = analysis;
    if (!aspects || aspects.length === 0) {
        quickResults.innerHTML = `<div class="result-empty">No known aspects detected.</div>`;
        return;
    }

    const detected = aspects.map(a => a.name).join(', ');
    const lines = [`<div><strong>Detected aspects:</strong> ${escapeHtml(detected)}</div>`];

    for (const a of aspects) {
        lines.push(`<div class="aspect-line"><strong>${escapeHtml(a.name)}</strong> - ${escapeHtml(a.sentiment)}</div>`);
    }

    quickResults.innerHTML = lines.join('\n');
}

// ------------------- end quick analyzer -------------------
