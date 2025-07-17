import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database file path
const dbPath = join(__dirname, '../../database/posts.db');

// Create database connection with directory creation
const createDatabaseConnection = async () => {
  try {
    // Create database directory if it doesn't exist
    const dbDir = dirname(dbPath);
    await mkdir(dbDir, { recursive: true });
    
    // Create database connection
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          // Enable foreign keys
          db.run('PRAGMA foreign_keys = ON');
          resolve(db);
        }
      });
    });
  } catch (error) {
    console.error('Error creating database directory:', error);
    throw error;
  }
};

// Initialize database connection
let db = null;

const getDatabase = async () => {
  if (!db) {
    db = await createDatabaseConnection();
  }
  return db;
};

export default getDatabase; 