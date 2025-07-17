import { jest } from '@jest/globals';

/**
 * Mock factory for creating database mocks
 */
export const createMockDatabase = () => {
  const mockDb = {
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
    serialize: jest.fn(),
    prepare: jest.fn(),
    close: jest.fn()
  };

  // Mock prepare method to return statement mock
  mockDb.prepare.mockReturnValue({
    run: jest.fn(),
    finalize: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
  });

  return mockDb;
};

/**
 * Mock factory for creating axios mocks
 */
export const createMockAxios = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn()
});

/**
 * Mock factory for creating Express request objects
 */
export const createMockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides
});

/**
 * Mock factory for creating Express response objects
 */
export const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock factory for creating Express next function
 */
export const createMockNext = () => jest.fn();

/**
 * Mock factory for creating logger
 */
export const createMockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
});

/**
 * Test data factories
 */
export const createMockPost = (overrides = {}) => ({
  id: 1,
  userId: 1,
  title: 'Test Post',
  body: 'Test post body',
  ...overrides
});

export const createMockPosts = (count = 2) => 
  Array.from({ length: count }, (_, i) => createMockPost({
    id: i + 1,
    title: `Test Post ${i + 1}`,
    body: `Test post body ${i + 1}`
  }));

export const createMockPagination = (overrides = {}) => ({
  page: 1,
  size: 10,
  total: 2,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
  ...overrides
});

export const createMockPostsResult = (posts = null, pagination = null) => ({
  posts: posts || createMockPosts(),
  pagination: pagination || createMockPagination()
});

/**
 * Error factories
 */
export const createPostError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.name = 'PostError';
  return error;
};

export const createAxiosError = (type = 'network', statusCode = null) => {
  const error = new Error('Request failed');
  
  switch (type) {
    case 'response':
      error.response = { status: statusCode || 500 };
      break;
    case 'request':
      error.request = {};
      break;
    case 'network':
    default:
      // Just the error message
      break;
  }
  
  return error;
};

/**
 * Database callback helpers
 */
export const mockDatabaseSuccess = (mockDb, method, result) => {
  mockDb[method].mockImplementation((query, params, callback) => {
    if (typeof params === 'function') {
      // Handle case where params is actually the callback
      params(null, result);
    } else {
      callback(null, result);
    }
  });
};

export const mockDatabaseError = (mockDb, method, error) => {
  mockDb[method].mockImplementation((query, params, callback) => {
    if (typeof params === 'function') {
      // Handle case where params is actually the callback
      params(error, null);
    } else {
      callback(error, null);
    }
  });
};

/**
 * Async test helpers
 */
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const expectAsyncError = async (asyncFn, expectedError) => {
  try {
    await asyncFn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    expect(error.message).toContain(expectedError);
  }
};

/**
 * Mock reset helpers
 */
export const resetAllMocks = (...mocks) => {
  mocks.forEach(mock => {
    if (mock && typeof mock.mockClear === 'function') {
      mock.mockClear();
    } else if (mock && typeof mock === 'object') {
      Object.values(mock).forEach(fn => {
        if (fn && typeof fn.mockClear === 'function') {
          fn.mockClear();
        }
      });
    }
  });
};