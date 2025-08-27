/**
 * Test Database Helper
 * Learning: Isolated test database management for integration tests
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { CREATE_URL_TABLE } from '../../src/models/url.model';
import fs from 'fs';
import path from 'path';

export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private db: Database | null = null;
  private testDbPath: string;

  private constructor() {
    this.testDbPath = ':memory:'; // Use in-memory database for tests
  }

  public static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager();
    }
    return TestDatabaseManager.instance;
  }

  public async connect(): Promise<Database> {
    try {
      this.db = await open({
        filename: this.testDbPath,
        driver: sqlite3.Database
      });

      await this.db.exec('PRAGMA foreign_keys = ON;');
      await this.db.exec(CREATE_URL_TABLE);

      return this.db;
    } catch (error) {
      throw new Error(`Failed to create test database: ${error}`);
    }
  }

  public getDatabase(): Database {
    if (!this.db) {
      throw new Error('Test database not connected');
    }
    return this.db;
  }

  // ✅ ADDED: seedTestData method
  public async seedTestData(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const testUrls = [
      {
        short_code: 'test123',
        original_url: 'https://example.com/test1',
        click_count: 0,
        is_active: 1
      },
      {
        short_code: 'github',
        original_url: 'https://github.com',
        custom_alias: 'github',
        click_count: 5,
        is_active: 1
      },
      {
        short_code: 'expired',
        original_url: 'https://example.com/expired',
        expires_at: '2024-01-01 00:00:00',
        click_count: 0,
        is_active: 1
      }
    ];

    for (const url of testUrls) {
      await this.db.run(`
        INSERT INTO urls (
          short_code, original_url, custom_alias, click_count,
          expires_at, created_at, updated_at, is_active
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)
      `, [
        url.short_code,
        url.original_url,
        url.custom_alias || null,
        url.click_count,
        url.expires_at || null,
        url.is_active
      ]);
    }
  }

  public async clearData(): Promise<void> {
    if (!this.db) return;
    await this.db.exec('DELETE FROM urls');
    await this.db.exec('DELETE FROM sqlite_sequence WHERE name = "urls"');
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}
