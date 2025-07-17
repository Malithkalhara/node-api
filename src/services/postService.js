import axios from 'axios';
import getDatabase from '../database/connection.js';
import logger from '../utils/logger.js';

const EXTERNAL_API_URL = 'https://jsonplaceholder.typicode.com/posts';

class PostError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'PostError';
  }
}

const fetchPostsFromAPI = async () => {
  try {
    logger.info('Fetching posts from external API');
    const response = await axios.get(EXTERNAL_API_URL);
    return response.data;
  } catch (error) {
    logger.error('Error fetching from external API:', error.message);
    if (error.response) {
      throw new PostError(`External API error: ${error.response.status}`, 502);
    } else if (error.request) {
      throw new PostError('External API is not responding', 502);
    } else {
      throw new PostError('Failed to fetch posts from external API', 500);
    }
  }
};

const savePostsToDatabase = async (posts) => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const insertQuery = 'INSERT OR REPLACE INTO posts (id, userId, title, body) VALUES (?, ?, ?, ?)';
    db.serialize(() => {
      const stmt = db.prepare(insertQuery);
      posts.forEach(post => {
        stmt.run(post.id, post.userId, post.title, post.body);
      });
      stmt.finalize((err) => {
        if (err) {
          logger.error('Error saving posts to database:', err.message);
          reject(new PostError('Failed to save posts to database', 500));
        } else {
          logger.info(`Saved ${posts.length} posts to database`);
          resolve();
        }
      });
    });
  });
};

const getAllPostsFromDatabase = async (page = 1, size = 10) => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * size;
    const countQuery = 'SELECT COUNT(*) as total FROM posts';
    db.get(countQuery, [], (err, countResult) => {
      if (err) {
        logger.error('Error counting posts:', err.message);
        reject(new PostError('Failed to count posts', 500));
        return;
      }
      const total = countResult.total;
      const query = 'SELECT * FROM posts ORDER BY id LIMIT ? OFFSET ?';
      db.all(query, [size, offset], (err, rows) => {
        if (err) {
          logger.error('Error fetching posts from database:', err.message);
          reject(new PostError('Failed to fetch posts from database', 500));
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
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM posts WHERE id = ?';
    db.get(query, [id], (err, row) => {
      if (err) {
        logger.error('Error fetching post from database:', err.message);
        reject(new PostError('Failed to fetch post from database', 500));
      } else {
        resolve(row);
      }
    });
  });
};

const savePostToDatabase = async (post) => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const query = 'INSERT OR REPLACE INTO posts (id, userId, title, body) VALUES (?, ?, ?, ?)';
    db.run(query, [post.id, post.userId, post.title, post.body], function(err) {
      if (err) {
        logger.error('Error saving post to database:', err.message);
        reject(new PostError('Failed to save post to database', 500));
      } else {
        logger.info(`Saved post ${post.id} to database`);
        resolve();
      }
    });
  });
};

const fetchPostFromAPI = async (id) => {
  try {
    logger.info(`Fetching post ${id} from external API`);
    const response = await axios.get(`${EXTERNAL_API_URL}/${id}`);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching post ${id} from external API:`, error.message);
    if (error.response) {
      if (error.response.status === 404) {
        throw new PostError(`Post with ID ${id} not found`, 404);
      }
      throw new PostError(`External API error: ${error.response.status}`, 502);
    } else if (error.request) {
      throw new PostError('External API is not responding', 502);
    } else {
      throw new PostError(`Failed to fetch post ${id} from external API`, 500);
    }
  }
};

export const getAllPosts = async (page = 1, size = 10) => {
  try {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validSize = Math.min(100, Math.max(1, parseInt(size) || 10));
    let result = await getAllPostsFromDatabase(validPage, validSize);
    if (result.posts.length === 0 && validPage === 1) {
      logger.info('Database is empty, fetching from external API');
      const externalPosts = await fetchPostsFromAPI();
      await savePostsToDatabase(externalPosts);
      result = await getAllPostsFromDatabase(validPage, validSize);
    }
    return result;
  } catch (error) {
    logger.error('Error in getAllPosts:', error.message);
    throw error;
  }
};

export const getPostById = async (id) => {
  try {
    let post = await getPostFromDatabase(id);
    if (!post) {
      logger.info(`Post ${id} not in database, fetching from external API`);
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
    logger.error(`Error in getPostById(${id}):`, error.message);
    throw error;
  }
}; 