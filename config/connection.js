const mongoClient = require("mongodb").MongoClient;

let db = null;

module.exports.connect = async function () {
  const url = "mongodb://localhost:27017";
  const dbname = "shopping";

  try {
    const client = await mongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db(dbname);
    
    if (!db) {
      throw new Error(`Database "${dbname}" does not exist.`);
    }
    
    console.log("Successfully connected to the database:", dbname);
  } catch (err) {
    console.error("Error occurred during MongoDB connection:", err.message);
  }
};

module.exports.get = function () {
  if (!db) {
    throw new Error("Database connection has not been established yet.");
  }
  return db;
};
