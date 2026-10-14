import { MongoClient } from 'mongodb';

const CONNECT_TIMEOUT_MS = 5000;

let client, db;

export async function connectToMongo() {
  if (!db) {
    client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    });
    await client.connect();
    console.log('Connected to mongo');
    db = client.db(process.env.MONGODB_NAME);
  }

  return db;
}
