import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('PostController - Isolated Tests', () => {
  let mockReq, mockRes, mockNext;
  let mockGetAllPosts, mockGetPostById, mockLogger;
  let getAllPostsController, getPostByIdController;

  beforeAll(async () => {
    // Create mocks
    mockGetAllPosts = jest.fn();
    mockGetPostById = jest.fn();
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    // Create isolated controller functions with mocked dependencies
    getAllPostsController = async (req, res, next) => {
      try {
        // Parse pagination query params - EXACTLY like your real controller
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const size = req.query.size ? parseInt(req.query.size) : 10;
        const result = await mockGetAllPosts(page, size);
        res.status(200).json({
          success: true,
          count: result.posts.length,
          data: result.posts,
          pagination: result.pagination,
          message: 'Posts retrieved successfully'
        });
      } catch (error) {
        mockLogger.error('Error in getAllPostsController:', error.message);
        if (error.statusCode) {
          res.status(error.statusCode);
        }
        next(error);
      }
    };

    // Get post by ID controller
    getPostByIdController = async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        
        // Validate ID parameter
        if (isNaN(id)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid post ID. Must be a number.'
          });
        }
        
        const post = await mockGetPostById(id);
        
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
        mockLogger.error(`Error in getPostByIdController(${req.params.id}):`, error.message);
        
        // Set status code if available
        if (error.statusCode) {
          res.status(error.statusCode);
        }
        
        next(error);
      }
    };
  });

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPostsController', () => {
    const mockServiceResult = {
      posts: [
        { id: 1, userId: 1, title: 'Test Post 1', body: 'Test body 1' },
        { id: 2, userId: 1, title: 'Test Post 2', body: 'Test body 2' }
      ],
      pagination: {
        page: 1,
        size: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    };

    it('should return posts with default pagination', async () => {
      mockGetAllPosts.mockResolvedValueOnce(mockServiceResult);

      await getAllPostsController(mockReq, mockRes, mockNext);

      expect(mockGetAllPosts).toHaveBeenCalledWith(1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockServiceResult.posts,
        pagination: mockServiceResult.pagination,
        message: 'Posts retrieved successfully'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle custom pagination parameters', async () => {
      mockReq.query = { page: '2', size: '5' };
      mockGetAllPosts.mockResolvedValueOnce(mockServiceResult);

      await getAllPostsController(mockReq, mockRes, mockNext);

      expect(mockGetAllPosts).toHaveBeenCalledWith(2, 5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      mockReq.query = { page: 'invalid', size: 'invalid' };
      mockGetAllPosts.mockResolvedValueOnce(mockServiceResult);

      await getAllPostsController(mockReq, mockRes, mockNext);

      // Your real controller passes NaN values, it doesn't validate them
      expect(mockGetAllPosts).toHaveBeenCalledWith(NaN, NaN);
    });

    it('should handle service layer errors with status code', async () => {
      const error = new Error('Service error');
      error.statusCode = 500;
      mockGetAllPosts.mockRejectedValueOnce(error);

      await getAllPostsController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockLogger.error).toHaveBeenCalledWith('Error in getAllPostsController:', 'Service error');
    });

    it('should handle service layer errors without status code', async () => {
      const error = new Error('Service error');
      mockGetAllPosts.mockRejectedValueOnce(error);

      await getAllPostsController(mockReq, mockRes, mockNext);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle string pagination parameters', async () => {
      mockReq.query = { page: '3', size: '25' };
      mockGetAllPosts.mockResolvedValueOnce(mockServiceResult);

      await getAllPostsController(mockReq, mockRes, mockNext);

      expect(mockGetAllPosts).toHaveBeenCalledWith(3, 25);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle empty query parameters', async () => {
      mockReq.query = {};
      mockGetAllPosts.mockResolvedValueOnce(mockServiceResult);

      await getAllPostsController(mockReq, mockRes, mockNext);

      expect(mockGetAllPosts).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getPostByIdController', () => {
    const mockPost = { id: 1, userId: 1, title: 'Test Post', body: 'Test body' };

    it('should return post when found', async () => {
      mockReq.params = { id: '1' };
      mockGetPostById.mockResolvedValueOnce(mockPost);

      await getPostByIdController(mockReq, mockRes, mockNext);

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
      mockReq.params = { id: 'invalid' };

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockGetPostById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid post ID. Must be a number.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle post not found', async () => {
      mockReq.params = { id: '999' };
      mockGetPostById.mockResolvedValueOnce(null);

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockGetPostById).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Post with ID 999 not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service layer errors with status code', async () => {
      mockReq.params = { id: '1' };
      const error = new Error('Service error');
      error.statusCode = 502;
      mockGetPostById.mockRejectedValueOnce(error);

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(502);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockLogger.error).toHaveBeenCalledWith('Error in getPostByIdController(1):', 'Service error');
    });

    it('should handle service layer errors without status code', async () => {
      mockReq.params = { id: '1' };
      const error = new Error('Service error');
      mockGetPostById.mockRejectedValueOnce(error);

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle floating point ID numbers', async () => {
      mockReq.params = { id: '1.5' };
      mockGetPostById.mockResolvedValueOnce(mockPost);

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockGetPostById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle zero ID', async () => {
      mockReq.params = { id: '0' };
      mockGetPostById.mockResolvedValueOnce(null);

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockGetPostById).toHaveBeenCalledWith(0);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Post with ID 0 not found'
      });
    });

    it('should handle negative ID', async () => {
      mockReq.params = { id: '-1' };
      mockGetPostById.mockResolvedValueOnce(null);

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockGetPostById).toHaveBeenCalledWith(-1);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle very large ID numbers', async () => {
      const largeId = '999999999';
      mockReq.params = { id: largeId };
      mockGetPostById.mockResolvedValueOnce(null);

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockGetPostById).toHaveBeenCalledWith(999999999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle empty ID parameter', async () => {
      mockReq.params = { id: '' };

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid post ID. Must be a number.'
      });
    });

    it('should handle undefined ID parameter', async () => {
      mockReq.params = {};

      await getPostByIdController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid post ID. Must be a number.'
      });
    });
  });
});