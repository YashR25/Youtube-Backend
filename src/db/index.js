import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDb = async () => {
  try {
    const mongoDbConnection = await mongoose.connect(
      `${process.env.DB_URI}/${DB_NAME}`
    );
    console.log(
      `Database connection succefull on host: ${mongoDbConnection.connection.host}`
    );
  } catch (error) {
    console.log("Mongodb Connection Failed: ", error);
    process.exit(1);
  }
};
