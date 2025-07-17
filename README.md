<!-- GenAI -->
# Node.js Web API with SQLite Database

A Node.js Web API that fetches data from a 3rd party API (JSONPlaceholder) and stores it in a SQLite database. The API provides RESTful endpoints to retrieve data, with intelligent caching that checks the database first before fetching from the external API.

## 🚀 Features

- **3rd Party API Integration**: Fetches posts data from JSONPlaceholder API
- **SQLite Database**: Stores data locally using SQLite (no ORM, pure SQL queries)
- **RESTful API**: Two endpoints - get all posts and get post by ID
- **Smart Caching**: Checks database first, then fetches from external API if needed
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **ES6 Syntax**: Uses modern JavaScript features
- **MVC Architecture**: Clean separation with Controllers, Services, and Routes
- **Comprehensive Testing**: Unit and integration tests with Jest

## 📁 Project Structure

```
├── src/
│   ├── app.js                 # Main application entry point
│   ├── controllers/
│   │   └── postController.js  # HTTP request/response handling
│   ├── database/
│   │   ├── init.js           # Database initialization and schema
│   │   └── connection.js     # Database connection
│   ├── routes/
│   │   └── posts.js          # API routes for posts
│   ├── services/
│   │   └── postService.js    # Business logic for posts
│   └── utils/
│       └── logger.js         # Simple logging utility
├── tests/
│   ├── unit/
│   │   ├── postController.test.js  # Controller unit tests
│   │   └── postService.test.js     # Service unit tests
│   └── integration/
│       └── posts.test.js           # API integration tests
├── database/
│   └── posts.db              # SQLite database file (created automatically)
├── package.json
├── README.md
└── .env.example
```

## 🛠️ Installation & Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd node-api
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

4. **Initialize the database:**
```bash
npm run init-db
```

5. **Start the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

**Note**: This project uses JSONPlaceholder API which doesn't require an API key.

## 🔗 API Endpoints

### Get All Posts
```
GET /api/v1/posts?page=1&size=10
```
Returns paginated posts from the database. If database is empty, fetches from external API first.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `size` (optional, default: 10): Number of posts per page (max 100)

**Success Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "size": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Posts retrieved successfully"
}
```

### Get Post by ID
```
GET /api/v1/posts/:id
```
Returns a specific post by ID. If not in database, fetches from external API first.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "title": "...",
    "body": "...",
    "created_at": "..."
  },
  "message": "Post retrieved successfully"
}
```

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid post ID. Must be a number."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Post with ID 999 not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

### 502 Bad Gateway
```json
{
  "success": false,
  "message": "External service temporarily unavailable"
}
```

## 📊 Database Schema

The application uses SQLite with the following schema:

```sql
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database and create tables
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🧪 Testing

The application includes comprehensive testing with Jest:

### Unit Tests
- **Controller Tests**: Test HTTP request/response handling
- **Service Tests**: Test business logic and external API integration

### Integration Tests
- **API Tests**: Test complete API endpoints with supertest
- **Error Handling**: Test various error scenarios

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
Tests cover:
- ✅ Controller functions (input validation, error handling)
- ✅ Service functions (business logic, database operations)
- ✅ API endpoints (HTTP responses, status codes)
- ✅ Error scenarios (invalid inputs, missing data)
- ✅ External API integration
- ✅ Database operations

## 🏗️ Architecture

### MVC Pattern Implementation

1. **Controllers** (`src/controllers/`)
   - Handle HTTP requests and responses
   - Input validation
   - Error handling for HTTP layer

2. **Services** (`src/services/`)
   - Business logic
   - Database operations
   - External API integration

3. **Routes** (`src/routes/`)
   - Define API endpoints
   - Connect routes to controllers

4. **Database** (`src/database/`)
   - Database connection and initialization
   - Raw SQL queries (no ORM)

## 📚 Framework & Library Decisions

### Express.js
- **Why**: Lightweight, flexible web framework for Node.js
- **Benefits**: Easy routing, middleware support, large community

### SQLite3
- **Why**: Self-contained, serverless database perfect for this use case
- **Benefits**: No separate database server needed, file-based storage

### Axios
- **Why**: Promise-based HTTP client for making API requests
- **Benefits**: Better error handling, request/response interceptors

### CORS
- **Why**: Enable cross-origin requests for web applications
- **Benefits**: Allows frontend applications to consume the API

### Jest
- **Why**: Popular testing framework with excellent ES6 support
- **Benefits**: Built-in mocking, coverage reporting, watch mode

### Supertest
- **Why**: HTTP assertion library for testing Express applications
- **Benefits**: Easy API testing, request/response validation

## 🚨 Error Handling

The application includes comprehensive error handling:

### Error Types
- **400 Bad Request**: Invalid input parameters
- **404 Not Found**: Resource not found (post doesn't exist)
- **500 Internal Server Error**: Database or application errors
- **502 Bad Gateway**: External API errors or unavailability

### Error Features
- **Proper HTTP Status Codes**: Each error type returns appropriate status code
- **Meaningful Error Messages**: Clear, user-friendly error messages
- **Development vs Production**: Different error detail levels based on environment
- **Logging**: All errors are logged for debugging
- **Graceful Degradation**: Handles external API failures gracefully

## 🧪 Testing the API

1. **Get all posts:**
```bash
curl http://localhost:3000/api/v1/posts
```

2. **Get specific post:**
```bash
curl http://localhost:3000/api/v1/posts/1
```

3. **Test error handling (invalid ID):**
```bash
curl http://localhost:3000/api/v1/posts/invalid
```

4. **Test error handling (non-existent post):**
```bash
curl http://localhost:3000/api/v1/posts/999
```

5. **Health check:**
```bash
curl http://localhost:3000/health
```

## 📝 Notes

- The application uses ES6 modules (import/export syntax)
- No ORM is used - all database operations use raw SQL queries
- The external API used is JSONPlaceholder (https://jsonplaceholder.typicode.com)
- Database file is created automatically in the `database/` directory
- Follows MVC pattern for clean separation of concerns
- Comprehensive test coverage with Jest and Supertest
- Robust error handling with proper HTTP status codes 