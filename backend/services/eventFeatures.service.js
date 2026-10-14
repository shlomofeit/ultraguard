import { eventFeaturesRepo } from "../repositories/eventFeatures.repo.js";
import { roomsService } from "./rooms.service.js";
import { eventFeaturesSchema, validateSchema } from "../utils/validation.js";

function toDocument(event, features) {
  const doc = {
    _id: event.id,
    roomId: event.roomId,
    deviceId: event.deviceId,
    type: event.type,
    startedAt: new Date(event.startedAt),
    payload: event.payload,
    features,
    savedAt: new Date(),
  };

  return doc;
}

function toEventFeatures(doc) {
  const eventFeatures = {
    eventId: doc._id,
    roomId: doc.roomId,
    deviceId: doc.deviceId,
    type: doc.type,
    startedAt: doc.startedAt.toISOString(),
    payload: doc.payload,
    features: doc.features,
  };

  return eventFeatures;
}

async function saveFeatures(event, featuresData) {
  if (featuresData === undefined) {
    return null;
  }

  const features = validateSchema(eventFeaturesSchema, featuresData);
  const doc = toDocument(event, features);
  await eventFeaturesRepo.saveFeatures(doc);

  const eventFeatures = toEventFeatures(doc);
  return eventFeatures;
}

async function getFeatures(eventId, user) {
  const doc = await eventFeaturesRepo.getFeaturesByEventId(eventId);
  const canRead = doc && (await roomsService.canAccessRoom(user, doc.roomId));

  if (!canRead) {
    const error = new Error("Event features not found!");
    error.status = 404;
    throw error;
  }

  const eventFeatures = toEventFeatures(doc);
  return eventFeatures;
}

export const eventFeaturesService = { saveFeatures, getFeatures };
