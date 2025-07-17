import { jest } from '@jest/globals';

// Import the modules you want to mock
import { getAllPostsController, getPostByIdController } from '../../src/controllers/postController.js';

// Create manual mocks
const mockGetAllPosts = jest.fn();
const mockGetPostById = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerInfo = jest.fn();

// Mock the modules using jest.unstable_mockModule (for newer Jest versions)
jest.unstable_mockModule('../../src/services/postService.js', () => ({
  getAllPosts: mockGetAllPosts,
  getPostById: mockGetPostById
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  error: mockLoggerError,
  info: mockLoggerInfo
}));

describe('Post Controller Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock request object
    mockReq = {
      params: {},
      query: {}
    };
    
    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock next function
    mockNext = jest.fn();
  });

  describe('getAllPostsController', () => {
    it('should return all posts successfully', async () => {
      // Arrange
      const mockPosts = [
        { id: 1, userId: 1, title: 'Test Post 1', body: 'Test Body 1' },
        { id: 2, userId: 1, title: 'Test Post 2', body: 'Test Body 2' }
      ];
      
      const mockResult = {
        posts: mockPosts,
        pagination: {
          page: 1,
          size: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
      
      mockGetAllPosts.mockResolvedValue(mockResult);
      
      // Act
      await getAllPostsController(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockGetAllPosts).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockPosts,
        pagination: mockResult.pagination,
        message: 'Posts retrieved successfully'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and call next', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockGetAllPosts.mockRejectedValue(error);
      
      // Act
      await getAllPostsController(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getPostByIdController', () => {
    it('should return a single post successfully', async () => {
      // Arrange
      const mockPost = { id: 1, userId: 1, title: 'Test Post', body: 'Test Body' };
      mockReq.params = { id: '1' };
      
      mockGetPostById.mockResolvedValue(mockPost);
      
      // Act
      await getPostByIdController(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockGetPostById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPost,
        message: 'Post retrieved successfully'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid ID parameter', async () => {
      // Arrange
      mockReq.params = { id: 'invalid' };
      
      // Act
      await getPostByIdController(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid post ID. Must be a number.'
      });
      expect(mockGetPostById).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 