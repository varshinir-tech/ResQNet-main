const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/disaster_relief_mangaluru';
  try {
    const conn = await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.log(`[MongoDB Notice]: Standalone MongoDB at ${targetUri} not active (${error.message}).`);
    try {
      console.log(`[MongoDB Memory]: Initializing built-in MongoDB engine...`);
      const { MongoMemoryServer } = require('mongodb-memory-server-core');
      const path = require('path');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: 'disaster_relief_mangaluru',
          dbPath: path.join(__dirname, '../.mongo_data')
        }
      });
      const uri = memoryServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB Connected]: In-process MongoDB engine running at ${uri}`);
    } catch (innerErr) {
      console.error(`[MongoDB Connection Error]: ${innerErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

