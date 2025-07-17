import express from 'express';
import { getAllPostsController, getPostByIdController } from '../controllers/postController.js';

const router = express.Router();

// Get all posts
router.get('/', getAllPostsController);

// Get post by ID
router.get('/:id', getPostByIdController);

export default router; 