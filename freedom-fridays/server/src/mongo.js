import { MongoClient, ServerApiVersion, GridFSBucket } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI in environment.");

const dbName = process.env.MONGODB_DB || "freedom-fridays";

let client;
let db;
let bucket;

export async function connectMongo() {
  if (db) return db;

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  db = client.db(dbName);
  bucket = new GridFSBucket(db, { bucketName: "devotionals_files" });

  await db.collection("devotionals").createIndex({ slug: 1 }, { unique: true });
  await db.collection("devotionals").createIndex({ date: -1 });
  await db.collection("devotionals").createIndex({ subjects: 1 });
  await db.collection("devotionals").createIndex({ text: "text", title: "text" });

  console.log("Mongo connected:", dbName);
  return db;
}

export function getDb() {
  if (!db) throw new Error("Mongo not connected yet.");
  return db;
}

export function getBucket() {
  if (!bucket) throw new Error("Mongo not connected yet.");
  return bucket;
}
