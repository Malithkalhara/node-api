// Global test setup - NO MODULE MOCKS HERE
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

// Global test utilities
global.createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

global.createMockNext = () => jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});