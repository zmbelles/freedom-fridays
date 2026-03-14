import express from "express";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import argon2 from "argon2";

import { getDb } from "../mongo.js";

const router = express.Router();

router.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many attempts. Try again later." },
});

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "ff_admin";
const JWT_SECRET = process.env.AUTH_JWT_SECRET;
const IS_PROD = (process.env.NODE_ENV || "development") === "production";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=1$ZmFrZXNhbHQ$5/4l6w7oO0z5g8d7nZg8jv8Y4C8Y2j8G5n6dQhQ6m3U";

function requireJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error("Missing AUTH_JWT_SECRET in environment.");
  }
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
  };
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge: SESSION_MAX_AGE_MS,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, getCookieOptions());
}

function signSessionToken(user) {
  requireJwtSecret();

  const roles = Array.isArray(user.roles) ? user.roles : [];

  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      roles,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function readSessionToken(req) {
  return req.cookies?.[COOKIE_NAME] || null;
}

function verifySessionToken(token) {
  requireJwtSecret();
  return jwt.verify(token, JWT_SECRET);
}

function invalidCredentials(res) {
  return res.status(401).json({
    ok: false,
    error: "Invalid credentials",
  });
}

function invalidSession(res) {
  return res.status(401).json({
    ok: false,
    error: "Invalid session",
  });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePassword(value) {
  return String(value || "");
}

async function findUserForLogin(db, email) {
  return db.collection("users").findOne(
    { email },
    {
      projection: {
        email: 1,
        passwordHash: 1,
        roles: 1,
        isActive: 1,
      },
    }
  );
}

async function verifyPasswordAgainstUser(password, user) {
  const hashToCheck = user?.passwordHash || DUMMY_HASH;

  try {
    return await argon2.verify(hashToCheck, password);
  } catch {
    return false;
  }
}

async function updateSuccessfulLogin(db, userId) {
  const now = new Date();

  await db.collection("users").updateOne(
    { _id: userId },
    {
      $set: {
        lastLoginAt: now,
        updatedAt: now,
      },
    }
  );
}

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const db = getDb();

    const email = normalizeEmail(req.body?.email);
    const password = normalizePassword(req.body?.password);

    if (!email || !password || email.length > 254 || password.length > 2000) {
      return invalidCredentials(res);
    }

    const user = await findUserForLogin(db, email);
    const passwordValid = await verifyPasswordAgainstUser(password, user);

    if (!user || !passwordValid || user.isActive !== true) {
      return invalidCredentials(res);
    }

    const token = signSessionToken(user);

    await updateSuccessfulLogin(db, user._id);
    setSessionCookie(res, token);

    return res.json({ ok: true });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
});

router.post("/logout", (req, res) => {
  clearSessionCookie(res);

  return res.json({ ok: true });
});

router.get("/me", (req, res) => {
  try {
    const token = readSessionToken(req);

    if (!token) {
      return invalidSession(res);
    }

    const decoded = verifySessionToken(token);

    return res.json({
      ok: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      },
    });
  } catch {
    return invalidSession(res);
  }
});

export default router;