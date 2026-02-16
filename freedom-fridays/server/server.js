import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectMongo } from "./src/mongo.js";
import devotionalsRouter from "./src/routes/devotionals.js";

dotenv.config();

const app = express();

// In dev, Vite proxy means same-origin; CORS isn't strictly required,
// but leaving it on is fine for future deployments.
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/devotionals", devotionalsRouter);

const port = Number(process.env.PORT || 3001);

async function main() {
  await connectMongo();
  app.listen(port, () => console.log(`API listening on :${port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
