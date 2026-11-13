
import {
  MongoClient,
  GridFSBucket,
} from "mongodb";

const uri = process.env.DATABASE_URL;

if (!uri) {
  throw new Error("MONGODB_URI is not configured");
}

const globalForMongo = globalThis as typeof globalThis & {
  audioMongoPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalForMongo.audioMongoPromise ??
  new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  }).connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo.audioMongoPromise = clientPromise;
}

export async function getAudioBucket() {
  const client = await clientPromise;

  const db = client.db();

  return new GridFSBucket(db, {
    bucketName: "wordAudio",
  });
}

export async function getAudioDatabase() {
  const client = await clientPromise;
  return client.db();
}
