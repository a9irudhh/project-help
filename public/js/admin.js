// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadFeedback();
});

// Check if user is authenticated
function checkAuth() {
  const token = sessionStorage.getItem('adminToken');
  if (!token) {
    // Redirect to login page if not authenticated
    window.location.href = '/login';
    return;
  }
}

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
  loadFeedback();
});

// Logout button
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('adminToken');
    window.location.href = '/login';
  }
});

async function loadFeedback() {
  const container = document.getElementById('feedbackContainer');
  container.innerHTML = '<p class="loading">Loading feedback...</p>';

  const token = sessionStorage.getItem('adminToken');

  try {
    const response = await fetch('/api/feedback', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Unauthorized - redirect to login
      sessionStorage.removeItem('adminToken');
      window.location.href = '/login';
      return;
    }

    const result = await response.json();

    if (result.success && result.data) {
      displayFeedback(result.data);
      updateStats(result.data.length);
    } else {
      container.innerHTML = '<p class="error">Failed to load feedback</p>';
    }
  } catch (error) {
    console.error('Error loading feedback:', error);
    container.innerHTML = '<p class="error">Error loading feedback. Please try again.</p>';
  }
}

function displayFeedback(feedbackList) {
  const container = document.getElementById('feedbackContainer');

  if (feedbackList.length === 0) {
    container.innerHTML = '<p class="no-data">No feedback submitted yet.</p>';
    return;
  }

  container.innerHTML = '';

  feedbackList.forEach(feedback => {
    const feedbackCard = document.createElement('div');
    feedbackCard.className = 'feedback-card';
    feedbackCard.innerHTML = `
      <div class="feedback-header">
        <div class="feedback-info">
          <h3>${escapeHtml(feedback.customer_name)}</h3>
          ${feedback.email ? `<p class="email">📧 ${escapeHtml(feedback.email)}</p>` : ''}
        </div>
        <div class="feedback-meta">
          <span class="date">📅 ${formatDate(feedback.created_at)}</span>
          <span class="id">#${feedback._id}</span>
        </div>
      </div>
      <div class="feedback-content">
        <p>${escapeHtml(feedback.feedback_text)}</p>
      </div>
      <div class="feedback-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteFeedback('${feedback._id}')">
          🗑️ Delete
        </button>
      </div>
    `;
    container.appendChild(feedbackCard);
  });
}

async function deleteFeedback(id) {
  if (!confirm('Are you sure you want to delete this feedback?')) {
    return;
  }

  const token = sessionStorage.getItem('adminToken');

  try {
    const response = await fetch(`/api/feedback/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Unauthorized - redirect to login
      sessionStorage.removeItem('adminToken');
      window.location.href = '/login';
      return;
    }

    const result = await response.json();

    if (result.success) {
      alert('Feedback deleted successfully');
      loadFeedback(); // Reload the list
    } else {
      alert(result.message || 'Failed to delete feedback');
    }
  } catch (error) {
    console.error('Error deleting feedback:', error);
    alert('Error deleting feedback. Please try again.');
  }
}

function updateStats(total) {
  document.getElementById('totalFeedback').textContent = total;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
