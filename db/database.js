const mongoose = require("mongoose");

module.exports.connect = async () => {
  const { DB_NAME } = process.env;
  const connectionString = `mongodb://localhost:27017/${DB_NAME}`;
  try {
    await mongoose.connect(connectionString);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
