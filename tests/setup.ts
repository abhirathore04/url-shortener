/**
 * Jest global setup for all tests
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

jest.setTimeout(30000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.REDIS_URL = 'redis://localhost:6379';

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;

beforeAll(async () => {
  // Start in-memory MongoDB for tests
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27018,
      dbName: 'test_shortener'
    }
  });
  
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  
  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  
  console.log('✅ Test MongoDB started');
});

afterAll(async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('✅ Test MongoDB stopped');
});

export const clearTestDatabase = async (): Promise<void> => {
  if (mongoClient) {
    const db = mongoClient.db();
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  }
};
