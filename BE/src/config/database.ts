import mongoose from "mongoose";

const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME;
const isProduction = process.env.NODE_ENV === "production";

// Cache connection for serverless (avoid reconnecting on every request)
let isConnected = false;

const connectDB = async (): Promise<void> => {
  // If already connected, skip
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Optimize settings for serverless
    const options: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: isServerless ? 3000 : 5000,
      socketTimeoutMS: isServerless ? 10000 : 45000,
      autoIndex: !isProduction,
      maxPoolSize: isServerless ? 1 : 10,
      minPoolSize: 0,
      maxIdleTimeMS: isServerless ? 10000 : 30000,
    };

    const conn = await mongoose.connect(mongoURI, options);
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    isConnected = false;
    throw error;
  }
};

// Handle connection events (only log in development)
if (!isProduction) {
  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.log("MongoDB disconnected");
  });

  mongoose.connection.on("error", (err: Error) => {
    isConnected = false;
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("reconnected", () => {
    isConnected = true;
    console.log("MongoDB reconnected");
  });
}

export default connectDB;
