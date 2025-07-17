import { getAllPosts, getPostById } from '../services/postService.js';
import logger from '../utils/logger.js';

// Get all posts controller
export const getAllPostsController = async (req, res, next) => {
  try {
    // Parse pagination query params
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const size = req.query.size ? parseInt(req.query.size) : 10;
    const result = await getAllPosts(page, size);
    res.status(200).json({
      success: true,
      count: result.posts.length,
      data: result.posts,
      pagination: result.pagination,
      message: 'Posts retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getAllPostsController:', error.message);
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
};

// Get post by ID controller
export const getPostByIdController = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID. Must be a number.'
      });
    }
    
    const post = await getPostById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: post,
      message: 'Post retrieved successfully'
    });
  } catch (error) {
    logger.error(`Error in getPostByIdController(${req.params.id}):`, error.message);
    
    // Set status code if available
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    
    next(error);
  }
}; 