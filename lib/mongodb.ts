import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "elrs"; // Add database name

if (!uri) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Allow global `var` in TS
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
    
    // Log connection success/failure
    global._mongoClientPromise
      .then(() => {
        console.log("✅ MongoDB connected successfully in development mode");
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error in development:", error);
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  
  clientPromise
    .then(() => {
      console.log("✅ MongoDB connected successfully in production mode");
    })
    .catch((error) => {
      console.error("❌ MongoDB connection error in production:", error);
    });
}

export default clientPromise;
export { dbName };