# Customer Feedback System

A full-stack customer feedback management system with a customer-facing form and an admin dashboard.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (MongoDB Atlas)

## Features

### Customer Features
- Submit feedback with name, email (optional), and feedback text
- Clean and responsive interface
- Form validation
- Success/error messages

### Admin Features
- Login with username and password
- View all feedback submissions
- See customer details and timestamps
- Delete feedback entries
- Refresh feedback list
- Statistics dashboard
- Secure logout functionality

## Project Structure

```
├── server.js              # Express server and API routes
├── database.js            # MongoDB connection and schema
├── package.json           # Dependencies
├── public/
│   ├── customer.html      # Customer feedback form page
│   ├── login.html         # Admin login page
│   ├── admin.html         # Admin dashboard page
│   ├── css/
│   │   └── style.css      # Styling for all pages
│   └── js/
│       ├── customer.js    # Customer form logic
│       ├── login.js       # Admin login logic
│       └── admin.js       # Admin dashboard logic
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. MongoDB Configuration

The application is configured to use MongoDB Atlas with the following connection string:
```
mongodb+srv://starwindow170_db_user:54mrsYHshuJoZELR@cluster0.uzadgqo.mongodb.net/feedback_system
```

The database name is `feedback_system` and it will automatically create a `feedbacks` collection.

### 3. Run the Application

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### 4. Access the Application

- **Customer Feedback Form**: http://localhost:3000
- **Admin Login**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin

### 5. Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

## API Endpoints

### Submit Feedback (Public)
```
POST /api/feedback
Content-Type: application/json

{
  "customer_name": "John Doe",
  "email": "john@example.com",
  "feedback_text": "Great service!"
}
```

### Admin Login
```
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response: { success, message, token }
```

### Get All Feedback (Protected)
```
GET /api/feedback
Authorization: Bearer <token>
```

### Get Single Feedback (Protected)
```
GET /api/feedback/:id
Authorization: Bearer <token>
```

### Delete Feedback (Protected)
```
DELETE /api/feedback/:id
Authorization: Bearer <token>
```

## Database Schema

```javascript
{
  customer_name: String (required),
  email: String (optional),
  feedback_text: String (required),
  created_at: Date (auto-generated)
}
```

## Environment Variables (Optional)

You can set the port using:
```bash
PORT=3000 npm start
```

## Security Notes

⚠️ **Important**: This is a basic implementation. For production use, consider:
- Using JWT tokens with proper expiration
- Hashing passwords with bcrypt
- Storing credentials in environment variables
- Adding authentication for admin routes
- Implementing rate limiting
- Adding input sanitization
- Using environment variables for sensitive data
- Adding HTTPS
- Implementing CORS properly for production domains
- Adding session timeout and refresh token mechanism

## License

ISC
