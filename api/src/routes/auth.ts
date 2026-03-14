import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../lib/firebase.js";

const router = Router();

// POST /auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    const db = getDb();

    const existing = await db
      .collection("users")
      .where("email", "==", trimmed)
      .limit(1)
      .get();

    let userId: string;

    if (!existing.empty) {
      userId = existing.docs[0].id;
      await db.collection("users").doc(userId).update({
        updatedAt: new Date().toISOString(),
      });
    } else {
      userId = uuidv4();
      await db.collection("users").doc(userId).set({
        email: trimmed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Create session token
    const sessionToken = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.collection("sessions").doc(sessionToken).set({
      userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    });

    res.json({ userId, email: trimmed, sessionToken });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/me
router.get("/me", async (req, res) => {
  try {
    const sessionToken = req.headers["x-session-token"] as string;
    if (!sessionToken) {
      res.json({ user: null });
      return;
    }

    const db = getDb();
    const doc = await db.collection("sessions").doc(sessionToken).get();
    if (!doc.exists) {
      res.json({ user: null });
      return;
    }

    const session = doc.data()!;
    if (new Date(session.expiresAt) < new Date()) {
      await doc.ref.delete();
      res.json({ user: null });
      return;
    }

    const userDoc = await db.collection("users").doc(session.userId).get();
    if (!userDoc.exists) {
      res.json({ user: null });
      return;
    }

    res.json({ user: { id: session.userId, ...userDoc.data() } });
  } catch (error) {
    console.error("Auth check error:", error);
    res.json({ user: null });
  }
});

export default router;
