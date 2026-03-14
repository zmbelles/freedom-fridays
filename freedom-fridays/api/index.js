import dotenv from "dotenv";
dotenv.config();

import { connectMongo } from "../server/src/mongo.js";
import app from "../server/app.js";

let connected = false;

export default async function handler(req, res) {
  if (!connected) {
    await connectMongo();
    connected = true;
  }
  return app(req, res);
}
