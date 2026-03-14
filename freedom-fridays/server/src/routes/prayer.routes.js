import express from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { getDb } from "../mongo.js";
import { checkProfanity, containsLink } from "../profanity.js";

const router = express.Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.toString().split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function clean(str, max) {
  return str.toString().trim().replace(/\s+/g, " ").slice(0, max);
}

function requireAuth(req, res, next) {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "AUTH_JWT_SECRET not configured." });
  const cookieName = process.env.AUTH_COOKIE_NAME || "ff_admin";
  const token = req.cookies?.[cookieName];
  if (!token) return res.status(401).json({ error: "Not authenticated." });
  try { jwt.verify(token, secret); next(); } catch {
    res.status(401).json({ error: "Invalid session." });
  }
}

async function isBanned(db, ip) {
  return !!(await db.collection("banned_ips").findOne({ ip }));
}

async function banIp(db, ip, severity, trigger) {
  // upsert so duplicate triggers don't throw
  await db.collection("banned_ips").updateOne(
    { ip },
    { $set: { ip, severity, trigger, bannedAt: new Date() } },
    { upsert: true }
  );
}

async function checkSpam(db, body) {
  // Duplicate: exact body already exists
  const duplicate = await db.collection("prayers").findOne({ body });
  if (duplicate) {
    return { spam: true, message: "This prayer has already been submitted." };
  }

  // Repetition: any single word making up more than 40% of the total words
  const words = body.toLowerCase().match(/\b\w+\b/g) || [];
  if (words.length > 0) {
    const freq = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    const maxCount = Math.max(...Object.values(freq));
    if (maxCount / words.length > 0.4) {
      return { spam: true, message: "Your prayer appears to contain repetitive content. Please write a genuine prayer." };
    }
  }

  return { spam: false };
}

function moderate(name, body) {
  if (containsLink(body) || containsLink(name)) {
    return { blocked: true, ban: false, message: "Links are not allowed." };
  }
  const hit = checkProfanity(`${name} ${body}`);
  if (!hit) return { blocked: false };
  if (hit.severity === 4) {
    return {
      blocked: true,
      ban: true,
      severity: hit.severity,
      trigger: hit.id,
      message: "This is a family friendly platform. The severity of your profanity has been rated as the highest. Your submission has been blocked and your access restricted.",
    };
  }
  return {
    blocked: true,
    ban: false,
    message: "Please keep your language respectful.",
  };
}

// ─── prayers ─────────────────────────────────────────────────────────────────

// GET /api/prayers
router.get("/", async (req, res) => {
  const db = getDb();
  const sort = req.query.sort === "date_asc" ? { createdAt: 1 } : { createdAt: -1 };
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));
  const skip = Math.max(0, Number(req.query.skip || 0));

  const [items, total] = await Promise.all([
    db
      .collection("prayers")
      .find({}, { projection: { ip: 0 } })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("prayers").countDocuments(),
  ]);

  res.json({ items, total });
});

// POST /api/prayers
router.post("/", async (req, res) => {
  const db = getDb();
  const ip = getClientIp(req);

  if (await isBanned(db, ip)) {
    return res.status(403).json({ error: "Your access has been restricted." });
  }

  const name = clean(req.body.name || "", 80) || "Anonymous";
  const body = clean(req.body.body || "", 2000);

  if (!body || body.length < 50) {
    return res.status(400).json({ error: "Prayer must be at least 50 characters." });
  }

  const spamVerdict = await checkSpam(db, body);
  if (spamVerdict.spam) {
    return res.status(400).json({ error: spamVerdict.message });
  }

  const verdict = moderate(name, body);
  if (verdict.blocked) {
    if (verdict.ban) await banIp(db, ip, verdict.severity, verdict.trigger);
    return res.status(verdict.ban ? 403 : 400).json({ error: verdict.message });
  }

  const now = new Date();
  const result = await db.collection("prayers").insertOne({
    name,
    body,
    ip,
    commentCount: 0,
    createdAt: now,
  });

  res.json({ ok: true, id: result.insertedId });
});

// ─── comments ────────────────────────────────────────────────────────────────

// GET /api/prayers/:id/comments
router.get("/:id/comments", async (req, res) => {
  const db = getDb();
  let id;
  try { id = new ObjectId(req.params.id); } catch {
    return res.status(400).json({ error: "Invalid prayer ID." });
  }

  const comments = await db
    .collection("prayer_comments")
    .find({ prayerId: id }, { projection: { ip: 0 } })
    .sort({ createdAt: 1 })
    .toArray();

  res.json({ comments });
});

// POST /api/prayers/:id/comments
router.post("/:id/comments", async (req, res) => {
  const db = getDb();
  const ip = getClientIp(req);

  if (await isBanned(db, ip)) {
    return res.status(403).json({ error: "Your access has been restricted." });
  }

  let id;
  try { id = new ObjectId(req.params.id); } catch {
    return res.status(400).json({ error: "Invalid prayer ID." });
  }

  const prayer = await db
    .collection("prayers")
    .findOne({ _id: id }, { projection: { _id: 1 } });
  if (!prayer) return res.status(404).json({ error: "Prayer not found." });

  const name = clean(req.body.name || "", 80) || "Anonymous";
  const body = clean(req.body.body || "", 1000);

  if (!body || body.length < 2) {
    return res.status(400).json({ error: "Comment is too short." });
  }

  const verdict = moderate(name, body);
  if (verdict.blocked) {
    if (verdict.ban) await banIp(db, ip, verdict.severity, verdict.trigger);
    return res.status(verdict.ban ? 403 : 400).json({ error: verdict.message });
  }

  await db.collection("prayer_comments").insertOne({
    prayerId: id,
    name,
    body,
    ip,
    createdAt: new Date(),
  });

  await db
    .collection("prayers")
    .updateOne({ _id: id }, { $inc: { commentCount: 1 } });

  res.json({ ok: true });
});

// ─── admin deletes ────────────────────────────────────────────────────────────

// DELETE /api/prayers/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const db = getDb();
  let id;
  try { id = new ObjectId(req.params.id); } catch {
    return res.status(400).json({ error: "Invalid prayer ID." });
  }
  await db.collection("prayer_comments").deleteMany({ prayerId: id });
  const result = await db.collection("prayers").deleteOne({ _id: id });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Prayer not found." });
  res.json({ ok: true });
});

// DELETE /api/prayers/:id/comments/:commentId
router.delete("/:id/comments/:commentId", requireAuth, async (req, res) => {
  const db = getDb();
  let prayerId, commentId;
  try {
    prayerId = new ObjectId(req.params.id);
    commentId = new ObjectId(req.params.commentId);
  } catch {
    return res.status(400).json({ error: "Invalid ID." });
  }
  const result = await db.collection("prayer_comments").deleteOne({ _id: commentId, prayerId });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Comment not found." });
  await db.collection("prayers").updateOne({ _id: prayerId }, { $inc: { commentCount: -1 } });
  res.json({ ok: true });
});

export default router;
