/**
 * MongoDB Initialization Script
 * Creates database, user, and collections with indexes
 */

print('🔧 Initializing MongoDB for URL Shortener...');

// Switch to application database
db = db.getSiblingDB('shortener');

// Create application user
try {
  db.createUser({
    user: 'urlshortener',
    pwd: 'UrlApp2025!mN4pT8kRbV6sL9wQ1xC4eH7jK0',
    roles: [
      { role: 'readWrite', db: 'shortener' },
      { role: 'dbAdmin', db: 'shortener' }
    ]
  });
  print('✅ Application user created');
} catch (error) {
  print('⚠️ User exists: ' + error.message);
}

// Create URLs collection with validation
try {
  db.createCollection('urls', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['shortCode', 'originalUrl', 'createdAt'],
        properties: {
          shortCode: {
            bsonType: 'string',
            minLength: 6,
            maxLength: 10
          },
          originalUrl: {
            bsonType: 'string',
            minLength: 10,
            maxLength: 2048
          },
          userId: { bsonType: 'string' },
          title: { bsonType: 'string', maxLength: 200 },
          createdAt: { bsonType: 'date' },
          expiresAt: { bsonType: 'date' },
          clickCount: { bsonType: 'int', minimum: 0 },
          isActive: { bsonType: 'bool' },
          tags: { bsonType: 'array', items: { bsonType: 'string' }}
        }
      }
    }
  });
  print('✅ URLs collection created');
} catch (error) {
  print('⚠️ Collection exists: ' + error.message);
}

// Create performance indexes
try {
  db.urls.createIndex({ shortCode: 1 }, { unique: true, background: true });
  db.urls.createIndex({ originalUrl: 1 }, { background: true });
  db.urls.createIndex({ userId: 1 }, { background: true, sparse: true });
  db.urls.createIndex({ createdAt: -1 }, { background: true });
  db.urls.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });
  print('✅ Indexes created');
} catch (error) {
  print('⚠️ Indexes exist: ' + error.message);
}

// Create analytics collection
try {
  db.createCollection('urlClicks', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['shortCode', 'timestamp'],
        properties: {
          shortCode: { bsonType: 'string' },
          timestamp: { bsonType: 'date' },
          ipAddress: { bsonType: 'string' },
          userAgent: { bsonType: 'string', maxLength: 1000 },
          country: { bsonType: 'string', minLength: 2, maxLength: 2 }
        }
      }
    }
  });

  db.urlClicks.createIndex({ shortCode: 1 }, { background: true });
  db.urlClicks.createIndex({ timestamp: -1 }, { background: true });
  db.urlClicks.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000, background: true });
  print('✅ Analytics collection created');
} catch (error) {
  print('⚠️ Analytics exists: ' + error.message);
}

// Insert sample data for development
try {
  db.urls.insertOne({
    shortCode: 'demo123',
    originalUrl: 'https://example.com',
    title: 'Example Site',
    createdAt: new Date(),
    clickCount: 0,
    isActive: true,
    tags: ['demo']
  });
  print('✅ Sample data inserted');
} catch (error) {
  print('⚠️ Sample data exists: ' + error.message);
}

print('🎉 MongoDB initialization complete!');
