import { connectToMongo } from "../config/mongo.js";

async function getCollection() {
  const db = await connectToMongo();

  return db.collection("eventFeatures");
}

async function createIndexes() {
  const collection = await getCollection();

  await collection.createIndex({ roomId: 1, startedAt: -1 });
  await collection.createIndex({ type: 1, startedAt: -1 });
}

async function saveFeatures(doc) {
  const collection = await getCollection();

  await collection.replaceOne({ _id: doc._id }, doc, { upsert: true });
}

async function getFeaturesByEventId(eventId) {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: eventId });

  return doc;
}

export const eventFeaturesRepo = {
  createIndexes,
  saveFeatures,
  getFeaturesByEventId,
};
