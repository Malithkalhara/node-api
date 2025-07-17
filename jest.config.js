export default {
    testEnvironment: 'node',
    
    transform: {},
    
    testMatch: [
      '**/__tests__/**/*.test.js',
      '**/?(*.)+(spec|test).js'
    ],
    
    moduleFileExtensions: ['js', 'json'],
    
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/app.js',
      '!src/database/init.js',
      '!src/database/connection.js',
      '!**/node_modules/**'
    ],
    
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    
    clearMocks: true,
    restoreMocks: true,
    
    verbose: true,
    
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    
    testTimeout: 10000
  };