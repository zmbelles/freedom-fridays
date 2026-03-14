import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { connectMongo } from "./src/mongo.js";
import devotionalsRouter from "./src/routes/devotionals.routes.js";
import prayerRouter from "./src/routes/prayer.routes.js";
import authRouter from "./src/routes/auth.routes.js";

dotenv.config();

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://freedom-fridays.com",
  "https://www.freedom-fridays.com",
]);

app.use(cors({
  origin(origin, cb) {
    // allow curl/postman/no-origin requests
    if (!origin) return cb(null, true);
    return cb(null, allowedOrigins.has(origin));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/devotionals", devotionalsRouter);
app.use("/api/prayers", prayerRouter);
app.use("/api/auth", authRouter);

const port = Number(process.env.PORT || 3001);

async function main() {
  await connectMongo();
  app.listen(port, () => console.log(`API listening on :${port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
