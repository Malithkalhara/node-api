import getDatabase from './connection.js';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database directory if it doesn't exist
const createDatabaseDirectory = async () => {
  try {
    const dbDir = dirname(__dirname) + '/../database';
    await mkdir(dbDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

// Initialize database tables
const initDatabase = async () => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    // Create posts table
    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createPostsTable, (err) => {
      if (err) {
        console.error('Error creating posts table:', err.message);
        reject(err);
      } else {
        console.log('Posts table created or already exists');
        resolve();
      }
    });
  });
};

// Main initialization function
export const initializeDatabase = async () => {
  try {
    await createDatabaseDirectory();
    await initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Export for direct execution
export { initDatabase }; 