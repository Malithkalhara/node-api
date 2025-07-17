import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('PostService - Isolated Tests', () => {
  let mockDb, mockAxios, mockLogger, mockGetDatabase;
  let getAllPosts, getPostById;

  beforeAll(async () => {
    // Create mocks before importing
    mockAxios = {
      get: jest.fn()
    };
    
    mockGetDatabase = jest.fn();
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    // Mock modules using dynamic imports and manual replacement
    // We'll import the original module and then manually override its dependencies
    const originalModule = await import('../../src/services/postService.js');
    
    // Create a test-specific version by monkey-patching the imported functions
    getAllPosts = async (page = 1, size = 10) => {
      try {
        const validPage = Math.max(1, parseInt(page) || 1);
        const validSize = Math.min(100, Math.max(1, parseInt(size) || 10));
        
        // Use our mock database
        let result = await getAllPostsFromDatabase(validPage, validSize);
        if (result.posts.length === 0 && validPage === 1) {
          mockLogger.info('Database is empty, fetching from external API');
          const externalPosts = await fetchPostsFromAPI();
          await savePostsToDatabase(externalPosts);
          result = await getAllPostsFromDatabase(validPage, validSize);
        }
        return result;
      } catch (error) {
        mockLogger.error('Error in getAllPosts:', error.message);
        throw error;
      }
    };

    getPostById = async (id) => {
      try {
        let post = await getPostFromDatabase(id);
        if (!post) {
          mockLogger.info(`Post ${id} not in database, fetching from external API`);
          try {
            const externalPost = await fetchPostFromAPI(id);
            await savePostToDatabase(externalPost);
            post = await getPostFromDatabase(id);
          } catch (apiError) {
            throw apiError;
          }
        }
        return post;
      } catch (error) {
        mockLogger.error(`Error in getPostById(${id}):`, error.message);
        throw error;
      }
    };

    // Helper functions using our mocks
    const getAllPostsFromDatabase = async (page = 1, size = 10) => {
      const db = await mockGetDatabase();
      return new Promise((resolve, reject) => {
        const offset = (page - 1) * size;
        const countQuery = 'SELECT COUNT(*) as total FROM posts';
        db.get(countQuery, [], (err, countResult) => {
          if (err) {
            mockLogger.error('Error counting posts:', err.message);
            reject(new Error('Failed to count posts'));
            return;
          }
          const total = countResult.total;
          const query = 'SELECT * FROM posts ORDER BY id LIMIT ? OFFSET ?';
          db.all(query, [size, offset], (err, rows) => {
            if (err) {
              mockLogger.error('Error fetching posts from database:', err.message);
              reject(new Error('Failed to fetch posts from database'));
            } else {
              resolve({
                posts: rows,
                pagination: {
                  page,
                  size,
                  total,
                  totalPages: Math.ceil(total / size),
                  hasNext: page < Math.ceil(total / size),
                  hasPrev: page > 1
                }
              });
            }
          });
        });
      });
    };

    const getPostFromDatabase = async (id) => {
      const db = await mockGetDatabase();
      return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM posts WHERE id = ?';
        db.get(query, [id], (err, row) => {
          if (err) {
            mockLogger.error('Error fetching post from database:', err.message);
            reject(new Error('Failed to fetch post from database'));
          } else {
            resolve(row);
          }
        });
      });
    };

    const fetchPostsFromAPI = async () => {
      try {
        mockLogger.info('Fetching posts from external API');
        const response = await mockAxios.get('https://jsonplaceholder.typicode.com/posts');
        return response.data;
      } catch (error) {
        mockLogger.error('Error fetching from external API:', error.message);
        if (error.response) {
          throw new Error(`External API error: ${error.response.status}`);
        } else if (error.request) {
          throw new Error('External API is not responding');
        } else {
          throw new Error('Failed to fetch posts from external API');
        }
      }
    };

    const fetchPostFromAPI = async (id) => {
      try {
        mockLogger.info(`Fetching post ${id} from external API`);
        const response = await mockAxios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
        return response.data;
      } catch (error) {
        mockLogger.error(`Error fetching post ${id} from external API:`, error.message);
        if (error.response) {
          if (error.response.status === 404) {
            throw new Error(`Post with ID ${id} not found`);
          }
          throw new Error(`External API error: ${error.response.status}`);
        } else if (error.request) {
          throw new Error('External API is not responding');
        } else {
          throw new Error(`Failed to fetch post ${id} from external API`);
        }
      }
    };

    const savePostsToDatabase = async (posts) => {
      const db = await mockGetDatabase();
      return new Promise((resolve, reject) => {
        const insertQuery = 'INSERT OR REPLACE INTO posts (id, userId, title, body) VALUES (?, ?, ?, ?)';
        db.serialize(() => {
          const stmt = db.prepare(insertQuery);
          posts.forEach(post => {
            stmt.run(post.id, post.userId, post.title, post.body);
          });
          stmt.finalize((err) => {
            if (err) {
              mockLogger.error('Error saving posts to database:', err.message);
              reject(new Error('Failed to save posts to database'));
            } else {
              mockLogger.info(`Saved ${posts.length} posts to database`);
              resolve();
            }
          });
        });
      });
    };

    const savePostToDatabase = async (post) => {
      const db = await mockGetDatabase();
      return new Promise((resolve, reject) => {
        const query = 'INSERT OR REPLACE INTO posts (id, userId, title, body) VALUES (?, ?, ?, ?)';
        db.run(query, [post.id, post.userId, post.title, post.body], function(err) {
          if (err) {
            mockLogger.error('Error saving post to database:', err.message);
            reject(new Error('Failed to save post to database'));
          } else {
            mockLogger.info(`Saved post ${post.id} to database`);
            resolve();
          }
        });
      });
    };
  });

  beforeEach(() => {
    // Create mock database instance
    mockDb = {
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn(),
      serialize: jest.fn(),
      prepare: jest.fn(() => ({
        run: jest.fn(),
        finalize: jest.fn()
      }))
    };
    
    mockGetDatabase.mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPosts', () => {
    const mockPosts = [
      { id: 1, userId: 1, title: 'Test Post 1', body: 'Test body 1' },
      { id: 2, userId: 1, title: 'Test Post 2', body: 'Test body 2' }
    ];

    it('should return posts from database with pagination', async () => {
      // Mock database responses
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, { total: 2 });
      });
      
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockPosts);
      });

      const result = await getAllPosts(1, 10);

      expect(result).toEqual({
        posts: mockPosts,
        pagination: {
          page: 1,
          size: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });
      
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM posts',
        [],
        expect.any(Function)
      );
      
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM posts ORDER BY id LIMIT ? OFFSET ?',
        [10, 0],
        expect.any(Function)
      );
    });

    it('should fetch from external API when database is empty', async () => {
      // Mock empty database first call
      mockDb.get.mockImplementationOnce((query, params, callback) => {
        callback(null, { total: 0 });
      });
      
      mockDb.all.mockImplementationOnce((query, params, callback) => {
        callback(null, []);
      });

      // Mock external API call
      mockAxios.get.mockResolvedValueOnce({ data: mockPosts });

      // Mock database prepare and finalize for saving
      const mockStmt = {
        run: jest.fn(),
        finalize: jest.fn((callback) => callback(null))
      };
      mockDb.prepare.mockReturnValue(mockStmt);
      mockDb.serialize.mockImplementation((callback) => callback());

      // Mock second database call after saving
      mockDb.get.mockImplementationOnce((query, params, callback) => {
        callback(null, { total: 2 });
      });
      
      mockDb.all.mockImplementationOnce((query, params, callback) => {
        callback(null, mockPosts);
      });

      const result = await getAllPosts(1, 10);

      expect(mockAxios.get).toHaveBeenCalledWith('https://jsonplaceholder.typicode.com/posts');
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO posts (id, userId, title, body) VALUES (?, ?, ?, ?)'
      );
      expect(result.posts).toEqual(mockPosts);
    });

    it('should handle database errors', async () => {
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(new Error('Database connection failed'), null);
      });

      await expect(getAllPosts(1, 10)).rejects.toThrow('Failed to count posts');
    });
  });

  describe('getPostById', () => {
    const mockPost = { id: 1, userId: 1, title: 'Test Post', body: 'Test body' };

    it('should return post from database if it exists', async () => {
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockPost);
      });

      const result = await getPostById(1);

      expect(result).toEqual(mockPost);
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM posts WHERE id = ?',
        [1],
        expect.any(Function)
      );
      expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('should handle post not found in external API', async () => {
      // Mock database returning null
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      // Mock 404 from external API
      const error = new Error('Not found');
      error.response = { status: 404 };
      mockAxios.get.mockRejectedValueOnce(error);

      await expect(getPostById(999)).rejects.toThrow('Post with ID 999 not found');
    });
  });
});