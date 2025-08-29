/**
 * Database Integration Tests
 * Learning: Testing database operations and data integrity
 */

import { TestDatabaseManager } from '../helpers/testDatabase';
import { Database } from 'sqlite';

describe('Database Integration Tests', () => {
  let testDb: TestDatabaseManager;
  let db: Database;

  beforeAll(async () => {
    testDb = TestDatabaseManager.getInstance();
    db = await testDb.connect();
  });

  beforeEach(async () => {
    await testDb.clearData();
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('Database Schema', () => {
    it('should have urls table with correct schema', async () => {
      const tableInfo = await db.all("PRAGMA table_info(urls)");
      
      const expectedColumns = [
        'id', 'short_code', 'original_url', 'custom_alias',
        'user_id', 'click_count', 'last_accessed', 'created_at',
        'updated_at', 'expires_at', 'is_active', 'title',
        'description', 'favicon'
      ];

      const actualColumns = tableInfo.map(col => col.name);
      
      expectedColumns.forEach(column => {
        expect(actualColumns).toContain(column);
      });
    });

    it('should have proper indexes', async () => {
      const indexes = await db.all("PRAGMA index_list(urls)");
      
      const indexNames = indexes.map(idx => idx.name);
      
      expect(indexNames).toContain('idx_short_code');
      expect(indexNames).toContain('idx_custom_alias');
    });

    it('should enforce unique constraints', async () => {
      // Insert first URL
      await db.run(`
        INSERT INTO urls (short_code, original_url, created_at, updated_at, is_active)
        VALUES ('test123', 'https://example.com', datetime('now'), datetime('now'), 1)
      `);

      // Try to insert duplicate short_code - should fail
      await expect(
        db.run(`
          INSERT INTO urls (short_code, original_url, created_at, updated_at, is_active)
          VALUES ('test123', 'https://example2.com', datetime('now'), datetime('now'), 1)
        `)
      ).rejects.toThrow();
    });
  });

  describe('CRUD Operations', () => {
    it('should insert URLs correctly', async () => {
      const result = await db.run(`
        INSERT INTO urls (
          short_code, original_url, custom_alias, click_count,
          created_at, updated_at, is_active
        ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), ?)
      `, ['abc123', 'https://example.com/test', 'test-alias', 0, 1]);

      expect(result.lastID).toBeTruthy();
      expect(result.changes).toBe(1);

      // Verify insertion
      const inserted = await db.get(
        'SELECT * FROM urls WHERE id = ?',
        [result.lastID]
      );

      expect(inserted).toMatchObject({
        id: result.lastID,
        short_code: 'abc123',
        original_url: 'https://example.com/test',
        custom_alias: 'test-alias',
        click_count: 0,
        is_active: 1
      });
    });

    it('should update click counts correctly', async () => {
      // Insert test URL
      const insertResult = await db.run(`
        INSERT INTO urls (short_code, original_url, click_count, created_at, updated_at, is_active)
        VALUES ('test123', 'https://example.com', 0, datetime('now'), datetime('now'), 1)
      `);

      // Update click count
      await db.run(`
        UPDATE urls 
        SET click_count = click_count + 1, 
            last_accessed = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `, [insertResult.lastID]);

      // Verify update
      const updated = await db.get(
        'SELECT click_count, last_accessed FROM urls WHERE id = ?',
        [insertResult.lastID]
      );

      expect(updated.click_count).toBe(1);
      expect(updated.last_accessed).toBeTruthy();
    });

    it('should soft delete URLs', async () => {
      // Insert test URL
      const insertResult = await db.run(`
        INSERT INTO urls (short_code, original_url, created_at, updated_at, is_active)
        VALUES ('test123', 'https://example.com', datetime('now'), datetime('now'), 1)
      `);

      // Soft delete
      await db.run(`
        UPDATE urls 
        SET is_active = 0, updated_at = datetime('now')
        WHERE id = ?
      `, [insertResult.lastID]);

      // Verify soft delete
      const deleted = await db.get(
        'SELECT is_active FROM urls WHERE id = ?',
        [insertResult.lastID]
      );

      expect(deleted.is_active).toBe(0);

      // Verify it's not found in active URLs
      const activeUrl = await db.get(`
        SELECT * FROM urls 
        WHERE id = ? AND is_active = 1
      `, [insertResult.lastID]);

      expect(activeUrl).toBeUndefined();
    });
  });

  describe('Data Validation', () => {
    it('should handle NULL values correctly', async () => {
      const result = await db.run(`
        INSERT INTO urls (
          short_code, original_url, custom_alias, expires_at,
          created_at, updated_at, is_active
        ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), ?)
      `, ['test123', 'https://example.com', null, null, 1]);

      const inserted = await db.get(
        'SELECT * FROM urls WHERE id = ?',
        [result.lastID]
      );

      expect(inserted.custom_alias).toBeNull();
      expect(inserted.expires_at).toBeNull();
    });

    it('should handle expiration dates correctly', async () => {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now

      await db.run(`
        INSERT INTO urls (
          short_code, original_url, expires_at,
          created_at, updated_at, is_active
        ) VALUES (?, ?, ?, datetime('now'), datetime('now'), ?)
      `, ['test123', 'https://example.com', expirationDate.toISOString(), 1]);

      const inserted = await db.get(
        'SELECT expires_at FROM urls WHERE short_code = ?',
        ['test123']
      );

      expect(inserted.expires_at).toBeTruthy();
      expect(new Date(inserted.expires_at)).toBeInstanceOf(Date);
    });
  });

  describe('Query Performance', () => {
    it('should query by short_code efficiently', async () => {
      // Insert multiple URLs
      for (let i = 0; i < 100; i++) {
        await db.run(`
          INSERT INTO urls (short_code, original_url, created_at, updated_at, is_active)
          VALUES (?, ?, datetime('now'), datetime('now'), 1)
        `, [`test${i}`, `https://example.com/${i}`]);
      }

      // Query with timing
      const startTime = Date.now();
      
      const result = await db.get(`
        SELECT * FROM urls WHERE short_code = ? AND is_active = 1
      `, ['test50']);
      
      const queryTime = Date.now() - startTime;

      expect(result).toBeTruthy();
      expect(result.short_code).toBe('test50');
      expect(queryTime).toBeLessThan(50); // Should be very fast with index
    });

    it('should handle concurrent database operations', async () => {
      const concurrentInserts = Array(10).fill(null).map((_, i) =>
        db.run(`
          INSERT INTO urls (short_code, original_url, created_at, updated_at, is_active)
          VALUES (?, ?, datetime('now'), datetime('now'), 1)
        `, [`concurrent${i}`, `https://example.com/concurrent${i}`])
      );

      const results = await Promise.all(concurrentInserts);

      // All should succeed
      results.forEach(result => {
        expect(result.changes).toBe(1);
        expect(result.lastID).toBeTruthy();
      });

      // Verify all were inserted
      const count = await db.get('SELECT COUNT(*) as count FROM urls');
      expect(count.count).toBe(10);
    });
  });
});
