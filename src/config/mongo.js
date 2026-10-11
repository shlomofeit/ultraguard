import { MongoClient } from 'mongodb';

let client, db;

export async function connectToMongo() {
  if (!db) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Mongo client connected');
    db = client.db(process.env);
  }

  return db;
}
