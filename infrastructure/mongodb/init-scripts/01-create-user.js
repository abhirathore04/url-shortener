/**
 * MongoDB Initialization Script
 * Creates application user and sets up initial indexes
 */

// Switch to the application database
db = db.getSiblingDB('shortener');

// Create application user
db.createUser({
  user: 'urlshortener',
  pwd: 'urlshortener123',
  roles: [
    {
      role: 'readWrite',
      db: 'shortener'
    }
  ]
});

// Create collections with schema validation
db.createCollection('urls', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['shortCode', 'originalUrl', 'createdAt'],
      properties: {
        shortCode: {
          bsonType: 'string',
          description: 'Short code for the URL - required and must be a string'
        },
        originalUrl: {
          bsonType: 'string',
          description: 'Original URL - required and must be a string'
        },
        userId: {
          bsonType: 'string',
          description: 'User ID who created the URL - optional'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp - required'
        },
        expiresAt: {
          bsonType: 'date',
          description: 'Expiration timestamp - optional'
        },
        clickCount: {
          bsonType: 'int',
          minimum: 0,
          description: 'Number of clicks - optional'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Whether URL is active - optional, defaults to true'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'Tags for categorization - optional'
        }
      }
    }
  }
});

// Create indexes for performance
db.urls.createIndex({ shortCode: 1 }, { unique: true });
db.urls.createIndex({ originalUrl: 1 });
db.urls.createIndex({ userId: 1 });
db.urls.createIndex({ createdAt: -1 });
db.urls.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create collection for analytics
db.createCollection('urlClicks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['shortCode', 'timestamp'],
      properties: {
        shortCode: {
          bsonType: 'string',
          description: 'Short code that was clicked'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Click timestamp'
        },
        userAgent: {
          bsonType: 'string',
          description: 'User agent string'
        },
        ipAddress: {
          bsonType: 'string',
          description: 'Client IP address'
        },
        referer: {
          bsonType: 'string',
          description: 'Referer header'
        },
        country: {
          bsonType: 'string',
          description: 'Country code'
        }
      }
    }
  }
});

// Create indexes for analytics
db.urlClicks.createIndex({ shortCode: 1 });
db.urlClicks.createIndex({ timestamp: -1 });
db.urlClicks.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days retention

print('✅ MongoDB initialization completed successfully');
