import express from "express";
import multer from "multer";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

import { getDb, getBucket } from "../mongo.js";
import {
  computeReadingTimeMinutes,
  docxBufferToHtmlAndText,
  makeExcerpt,
  slugify,
} from "../docx.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function odtBufferToDocxBuffer(odtBuffer) {
  const id = randomBytes(8).toString("hex");
  const inPath = join(tmpdir(), `ff-upload-${id}.odt`);
  const outDir = tmpdir();
  const outPath = join(outDir, `ff-upload-${id}.docx`);
  await writeFile(inPath, odtBuffer);
  await new Promise((resolve, reject) => {
    execFile("pandoc", [inPath, "-o", outPath], (err) => {
      err ? reject(new Error(`pandoc conversion failed: ${err.message}`)) : resolve();
    });
  });
  const docxBuffer = await readFile(outPath);
  await unlink(inPath).catch(() => {});
  await unlink(outPath).catch(() => {});
  return docxBuffer;
}

function requireUploadAuth(req, res, next) {
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

router.get("/", async (req, res) => {
  const db = getDb();

  const q = (req.query.q || "").toString().trim();
  const subject = (req.query.subject || "").toString().trim();
  const sort = (req.query.sort || "date_desc").toString();
  const limit = Math.min(500, Math.max(1, Number(req.query.limit || 50)));
  const skip = Math.max(0, Number(req.query.skip || 0));

  const filter = {};
  if (subject && subject !== "All") filter.subjects = subject;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { text: { $regex: q, $options: "i" } },
    ];
  }
  // if (q) filter.$text = { $search: q };

  const sortSpec = sort === "date_asc" ? { date: 1 } : { date: -1 };

  const items = await db
    .collection("devotionals")
    .find(filter, {
      projection: {
        title: 1,
        slug: 1,
        date: 1,
        subjects: 1,
        excerpt: 1,
        readingTimeMinutes: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    })
    .sort(sortSpec)
    .skip(skip)
    .limit(limit)
    .toArray();


  const total = await db.collection("devotionals").countDocuments(filter);

  res.json({ items, total });
});

router.get("/check-date", async (req, res) => {
  const db = getDb();
  const date = (req.query.date || "").toString().trim();
  if (!date) return res.json({ exists: false });

  const doc = await db.collection("devotionals").findOne(
    { date },
    { projection: { title: 1 } }
  );

  if (!doc) return res.json({ exists: false });
  res.json({ exists: true, title: doc.title });
});

router.get("/:slug", async (req, res) => {
  const db = getDb();
  const slug = req.params.slug;

  const doc = await db.collection("devotionals").findOne(
    { slug },
    {
      projection: {
        title: 1,
        slug: 1,
        date: 1,
        subjects: 1,
        html: 1,
        readingTimeMinutes: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    }
  );

  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

router.post("/upload", requireUploadAuth, upload.single("file"), async (req, res) => {
  const db = getDb();
  const bucket = getBucket();

  if (!req.file) return res.status(400).json({ error: "Missing file" });
  const originalFilename = req.file.originalname || "devotional.docx";
  const isOdt = originalFilename.toLowerCase().endsWith(".odt");
  const isDocx = originalFilename.toLowerCase().endsWith(".docx");

  if (!isDocx && !isOdt) {
    return res.status(400).json({ error: "File must be .docx or .odt" });
  }

  const rawTitle = (req.body.title || "").toString().trim();
  const date = (req.body.date || "").toString().trim();
  const subjects = parseSubjects(req.body.subjects);

  const docxBuffer = isOdt ? await odtBufferToDocxBuffer(req.file.buffer) : req.file.buffer;
  const { html, text } = await docxBufferToHtmlAndText(docxBuffer);

  const title =
    rawTitle ||
    guessTitleFromText(text) ||
    originalFilename.replace(/\.docx$/i, "").trim() ||
    "Untitled Devotional";

  const baseSlug = slugify(title);
  const slug = await ensureUniqueSlug(db, baseSlug);

  const readingTimeMinutes = computeReadingTimeMinutes(text);
  const excerpt = makeExcerpt(text);

  const uploadStream = bucket.openUploadStream(`${slug}.docx`, {
    metadata: { originalFilename, title, date, subjects },
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  uploadStream.end(docxBuffer);

  const fileId = await new Promise((resolve, reject) => {
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", reject);
  });

  const now = new Date();

  const doc = {
    title,
    slug,
    date: date || null,
    subjects,
    html,
    text,
    excerpt,
    readingTimeMinutes,
    docxFileId: fileId,
    originalFilename,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("devotionals").insertOne(doc);

  res.json({ ok: true, slug });
});

router.get("/:slug/docx", async (req, res) => {
  const db = getDb();
  const bucket = getBucket();
  const slug = req.params.slug;

  const doc = await db.collection("devotionals").findOne(
    { slug },
    { projection: { docxFileId: 1, originalFilename: 1 } }
  );
  if (!doc || !doc.docxFileId) return res.status(404).json({ error: "Not found" });

  const fileId = new ObjectId(doc.docxFileId);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${(doc.originalFilename || `${slug}.docx`).replace(/"/g, "")}"`
  );

  bucket.openDownloadStream(fileId).pipe(res);
});

function parseSubjects(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);

  const str = String(input).trim();
  if (!str) return [];

  if (str.startsWith("[") && str.endsWith("]")) {
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) return arr.map((s) => String(s).trim()).filter(Boolean);
    } catch (_e) {}
  }

  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function guessTitleFromText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const first = lines[0];
  if (!first) return null;
  if (first.length > 80) return null;
  return first;
}

async function ensureUniqueSlug(db, baseSlug) {
  if (!baseSlug) baseSlug = "devotional";
  let slug = baseSlug;
  let i = 2;

  while (await db.collection("devotionals").findOne({ slug }, { projection: { _id: 1 } })) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

export default router;
