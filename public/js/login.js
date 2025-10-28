document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const messageDiv = document.getElementById('message');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Get form data
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Validate
  if (!username || !password) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (result.success) {
      // Store token in sessionStorage
      sessionStorage.setItem('adminToken', result.token);
      showMessage('Login successful! Redirecting...', 'success');
      
      // Redirect to admin dashboard
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
    } else {
      showMessage(result.message || 'Invalid credentials', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('An error occurred. Please try again later.', 'error');
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
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
