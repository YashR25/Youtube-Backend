import dotenv from "dotenv";
import { connectDb } from "./db/index.js";

dotenv.config({
  path: "../.env",
});

connectDb();
