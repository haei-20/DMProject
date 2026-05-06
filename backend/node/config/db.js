const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = (process.env.MONGO_URI || process.env.MONGO_URL || "").trim();
    if (!mongoUri) {
      throw new Error("Missing MONGO_URI/MONGO_URL in environment");
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
