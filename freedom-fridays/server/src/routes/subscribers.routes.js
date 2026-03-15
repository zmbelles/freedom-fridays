import express from "express";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { getDb } from "../mongo.js";

const router = express.Router();

function requireAuth(req, res, next) {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "AUTH_JWT_SECRET not configured." });

  const cookieName = process.env.AUTH_COOKIE_NAME || "ff_admin";
  const token = req.cookies?.[cookieName];
  if (!token) return res.status(401).json({ error: "Not authenticated." });

  try {
    jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: "Invalid session." });
  }
}

// POST /api/subscribers — public subscribe
router.post("/", async (req, res) => {
  const db = getDb();
  const name = String(req.body?.name || "").trim().slice(0, 100);
  const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 254);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  const existing = await db.collection("subscribers").findOne({ email });
  if (existing) {
    if (existing.isActive) {
      return res.status(409).json({ error: "This email is already subscribed." });
    }
    // Re-activate
    const token = randomBytes(32).toString("hex");
    await db.collection("subscribers").updateOne(
      { email },
      { $set: { name, isActive: true, token, subscribedAt: new Date() } }
    );
    return res.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");
  await db.collection("subscribers").insertOne({
    name,
    email,
    token,
    isActive: true,
    subscribedAt: new Date(),
  });

  return res.json({ ok: true });
});

// GET /api/subscribers/unsubscribe?token=xxx — public unsubscribe
router.get("/unsubscribe", async (req, res) => {
  const db = getDb();
  const token = String(req.query.token || "").trim();
  if (!token) return res.status(400).json({ error: "Token required." });

  const result = await db.collection("subscribers").updateOne(
    { token },
    { $set: { isActive: false } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Token not found." });
  }

  return res.json({ ok: true });
});

// GET /api/subscribers — list active subscribers (authenticated)
router.get("/", requireAuth, async (req, res) => {
  const db = getDb();
  const subscribers = await db
    .collection("subscribers")
    .find({ isActive: true }, { projection: { email: 1, name: 1, token: 1, _id: 0 } })
    .toArray();
  return res.json({ ok: true, subscribers });
});

export default router;
