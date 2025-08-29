/**
 * Database Connection Manager
 * Learning: Singleton pattern for database connections
 */

import fs from 'fs';
import path from 'path';

import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';

import { CREATE_URL_TABLE } from '../models/url.model';
import { logError, logInfo } from '../utils/logger';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.db) {
      return;
    }

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(process.env.DB_PATH || './data/shortener.db');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Connect to SQLite database
      this.db = await open({
        filename: process.env.DB_PATH || './data/shortener.db',
        driver: sqlite3.Database,
      });

      // Enable foreign key constraints
      await this.db.exec('PRAGMA foreign_keys = ON;');

      // Create tables
      await this.db.exec(CREATE_URL_TABLE);

      this.isConnected = true;

      logInfo('Database connected successfully', {
        path: process.env.DB_PATH || './data/shortener.db',
        event: 'database_connected',
      });
    } catch (error) {
      this.isConnected = false;
      logError(error as Error, { event: 'database_connection_failed' });
      throw new Error(`Failed to connect to database: ${(error as Error).message}`);
    }
  }

  public getDatabase(): Database {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isConnected = false;
      logInfo('Database connection closed', { event: 'database_disconnected' });
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected && this.db !== null;
  }
}
