document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const messageDiv = document.getElementById('message');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Get form data
  const formData = {
    customer_name: document.getElementById('customerName').value.trim(),
    email: document.getElementById('email').value.trim(),
    feedback_text: document.getElementById('feedbackText').value.trim()
  };

  // Validate
  if (!formData.customer_name || !formData.feedback_text) {
    showMessage('Please fill in all required fields', 'error');
    return;
  }

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      showMessage('Thank you! Your feedback has been submitted successfully.', 'success');
      // Reset form
      document.getElementById('feedbackForm').reset();
    } else {
      showMessage(result.message || 'Failed to submit feedback', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('An error occurred. Please try again later.', 'error');
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Feedback';
  }
});

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';

  // Hide message after 5 seconds
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}
