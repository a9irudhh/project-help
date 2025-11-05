// API Base URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const reviewForm = document.getElementById('reviewForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const loader = submitBtn.querySelector('.loader');
const resultsSection = document.getElementById('resultsSection');
const newReviewBtn = document.getElementById('newReviewBtn');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadRecentReviews();
});

// Handle form submission
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
            // Display results
            displayResults(formData, result.data);
            
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

// Handle new review button
newReviewBtn.addEventListener('click', () => {
    // Reset form
    reviewForm.reset();
    
    // Show form, hide results
    document.querySelector('.form-section').style.display = 'block';
    resultsSection.style.display = 'none';
});

// Display sentiment analysis results
function displayResults(formData, resultData) {
    const { sentiment, confidence, details } = resultData;
    
    // Update sentiment badge
    const sentimentBadge = document.getElementById('sentimentBadge');
    sentimentBadge.textContent = sentiment;
    sentimentBadge.className = 'sentiment-badge ' + sentiment.toLowerCase();
    
    // Update confidence score
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceValue = document.getElementById('confidenceValue');
    confidenceBar.style.width = confidence + '%';
    confidenceBar.className = 'confidence-bar ' + sentiment.toLowerCase();
    confidenceValue.textContent = confidence + '%';
    
    // Update sentiment details
    document.getElementById('sentimentDetails').textContent = details;
    
    // Update review summary
    document.getElementById('resultProduct').textContent = formData.product_name;
    document.getElementById('resultReviewer').textContent = formData.reviewer_name;
    document.getElementById('resultReview').textContent = formData.review_text;
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
    submitBtn.disabled = isLoading;
    
    if (isLoading) {
        btnText.style.display = 'none';
        loader.style.display = 'block';
    } else {
        btnText.style.display = 'block';
        loader.style.display = 'none';
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
