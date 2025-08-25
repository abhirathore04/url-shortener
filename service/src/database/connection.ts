/**
 * Database Connection Manager
 * Learning: Database connections, connection pooling, error handling
 */

import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

import { CREATE_URL_TABLE } from '../models/url.model';
import { logInfo, logError } from '../utils/logger';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<void> {
    try {
      this.db = await open({
        filename: process.env.DB_PATH || './data/shortener.db',
        driver: sqlite3.Database,
      });

      // Initialize tables
      await this.db.exec(CREATE_URL_TABLE);

      logInfo('Database connected successfully', {
        event: 'db_connected',
        path: process.env.DB_PATH || './data/shortener.db',
      });
    } catch (error) {
      logError(error as Error, {
        event: 'db_connection_failed',
      });
      throw error;
    }
  }

  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      logInfo('Database connection closed');
    }
  }

  // Add this missing method
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) return false;
      await this.db.get('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
