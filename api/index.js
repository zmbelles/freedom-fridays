import dotenv from "dotenv";
dotenv.config();

import { connectMongo } from "../freedom-fridays/server/src/mongo.js";
import app from "../freedom-fridays/server/app.js";

let connected = false;

export default async function handler(req, res) {
  if (!connected) {
    await connectMongo();
    connected = true;
  }
  return app(req, res);
}
