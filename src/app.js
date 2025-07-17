import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postsRoutes from './routes/posts.js';
import { initDatabase } from './database/init.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/posts', postsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'API is running'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err.message);
  
  // Handle specific error types
  if (err.message && err.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      message: err.message
    });
  }
  
  if (err.message && err.message.includes('Invalid')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Handle database errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    logger.error('Database error:', err);
    return res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
  
  // Handle axios errors (external API errors)
  if (err.response) {
    logger.error('External API error:', err.response.status, err.response.data);
    return res.status(502).json({
      success: false,
      message: 'External service temporarily unavailable'
    });
  }
  
  if (err.request) {
    logger.error('External API request failed:', err.message);
    return res.status(502).json({
      success: false,
      message: 'External service temporarily unavailable'
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Development error response
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
        stack: err.stack
      }
    });
  } else {
    // Production error response
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? 'Internal server error' : message
    });
  }
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API endpoints: http://localhost:${PORT}/api/v1/posts`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 