# Product Sentiment Analysis System

A sentiment analysis application for product reviews powered by Google Gemini AI. The system analyzes product reviews and determines whether they are **Positive** or **Negative**.

## Features

- 🤖 **AI-Powered Sentiment Analysis** using Google Gemini API
- 📊 **Real-time Statistics** showing positive/negative review counts
- 💾 **MongoDB Database** for storing reviews and analysis results
- 🎨 **Modern Responsive UI** with beautiful gradient design
- 📱 **Mobile-Friendly** interface
- 🔄 **Live Updates** of recent reviews and statistics

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Google Generative AI (Gemini)

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (already configured)
- Google Gemini API Key (already configured)

## Installation

1. Navigate to the project directory:
```bash
cd project-2
```

2. Install dependencies:
```bash
npm install
```

3. The environment variables are already configured in `.env` file:
   - MongoDB URL
   - Gemini API Key
   - Server Port

## Running the Application

Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start at: **http://localhost:3000**

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Fill in the review form:
   - **Product Name**: Name of the product being reviewed
   - **Your Name**: Your name or reviewer name
   - **Your Review**: Write your honest product review
3. Click **"Analyze Sentiment"**
4. The AI will analyze the review and display:
   - Sentiment (Positive/Negative)
   - Detailed explanation of the sentiment
   - Review summary
5. View statistics and recent reviews at the bottom

### Quick Aspect Analyzer

In addition to submitting full reviews, the web UI includes a "Quick Aspect Analyzer" near the top of the page. Paste or type a short sentence like:

`the battery is good but the camera is not working`

The analyzer will display detected aspects (e.g., `battery, camera`) and a simple per-aspect sentiment (e.g., `battery - positive`, `camera - negative`). This is a lightweight, client-side heuristic and is useful for quick checks.

## Project Structure

```
project-2/
├── server.js              # Main server file with API endpoints
├── database.js            # MongoDB connection and schema
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── public/
│   ├── index.html        # Main frontend page
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       └── app.js        # Frontend JavaScript
```

## API Endpoints

### POST `/api/analyze-review`
Analyze a product review and save to database
- **Body**: `{ product_name, reviewer_name, review_text }`
- **Response**: `{ success, message, data: { sentiment, details } }`

### GET `/api/reviews`
Get all reviews sorted by most recent

### GET `/api/reviews/:id`
Get a specific review by ID

### GET `/api/statistics`
Get sentiment statistics (total, positive, negative counts)

## How It Works

1. User submits a product review through the web interface
2. Backend sends the review to Google Gemini AI API
3. Gemini analyzes the review and determines sentiment (Positive/Negative)
4. Result is saved to MongoDB database
5. Frontend displays the sentiment analysis result
6. Statistics and recent reviews are updated in real-time

## Environment Variables

The `.env` file contains:
```
MONGODB_URI=
GEMINI_API_KEY=
PORT=3000
```

## Notes

- The system focuses specifically on **product reviews**
- Sentiment analysis is binary: **Positive** or **Negative**
- Each review is stored with its sentiment analysis in MongoDB
- The AI provides a brief explanation for its sentiment determination

## Future Enhancements

- Add neutral sentiment category
- Implement user authentication
- Add filtering by product or sentiment
- Export reviews to CSV
- Add sentiment trends over time
- Multi-language support

## Troubleshooting

**Server won't start:**
- Make sure Node.js is installed: `node --version`
- Check if port 3000 is available
- Verify .env file exists

**Can't connect to MongoDB:**
- Check internet connection
- Verify MongoDB URL in .env file

**Sentiment analysis fails:**
- Verify Gemini API key is correct
- Check API quota/limits
- Review console for error messages

## License

ISC

---

Built with ❤️ using Google Gemini AI
