import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../lib/firebase.js";
import { scrapeUrl } from "../lib/firecrawl.js";
import { prefillQuestionnaire, generateReport } from "../lib/claude.js";
import type { Questionnaire } from "../types.js";

const router = Router();

// Helper: validate session and return userId
async function getUserId(req: { headers: Record<string, unknown> }): Promise<string | null> {
  const sessionToken = req.headers["x-session-token"] as string;
  if (!sessionToken) return null;

  const doc = await getDb().collection("sessions").doc(sessionToken).get();
  if (!doc.exists) return null;

  const session = doc.data()!;
  if (new Date(session.expiresAt) < new Date()) {
    await doc.ref.delete();
    return null;
  }

  return session.userId;
}

// POST /proposals
router.post("/", async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { url } = req.body;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "URL is required" });
      return;
    }

    const proposalId = uuidv4();
    const now = new Date().toISOString();
    const db = getDb();

    await db.collection("proposals").doc(proposalId).set({
      userId,
      url,
      status: "scraping",
      createdAt: now,
      updatedAt: now,
    });

    // Scrape
    let scrapedContent;
    try {
      scrapedContent = await scrapeUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scraping failed";
      await db.collection("proposals").doc(proposalId).update({
        status: "error",
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      });
      res.json({ proposalId, status: "error", errorMessage: message });
      return;
    }

    // AI prefill
    let questionnaire;
    try {
      questionnaire = await prefillQuestionnaire(url, scrapedContent);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI analysis failed";
      await db.collection("proposals").doc(proposalId).update({
        status: "error",
        scrapedContent,
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      });
      res.json({ proposalId, status: "error", errorMessage: message });
      return;
    }

    await db.collection("proposals").doc(proposalId).update({
      status: "questionnaire_ready",
      scrapedContent,
      questionnaire,
      updatedAt: new Date().toISOString(),
    });

    res.json({ proposalId, status: "questionnaire_ready", questionnaire });
  } catch (error) {
    console.error("Create proposal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /proposals/:id
router.get("/:id", async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const doc = await getDb().collection("proposals").doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const data = doc.data()!;
    if (data.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ proposal: { id: doc.id, ...data } });
  } catch (error) {
    console.error("Get proposal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /proposals (list all for user)
router.get("/", async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const snapshot = await getDb()
      .collection("proposals")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const proposals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ proposals });
  } catch (error) {
    console.error("List proposals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /proposals/:id/questionnaire
router.put("/:id/questionnaire", async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const db = getDb();
    const doc = await db.collection("proposals").doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const data = doc.data()!;
    if (data.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const questionnaire: Questionnaire = req.body;
    await db.collection("proposals").doc(req.params.id).update({
      questionnaireSubmitted: questionnaire,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Update questionnaire error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /proposals/:id/report
router.post("/:id/report", async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const db = getDb();
    const doc = await db.collection("proposals").doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const data = doc.data()!;
    if (data.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const questionnaire = data.questionnaireSubmitted || data.questionnaire;
    if (!questionnaire) {
      res.status(400).json({ error: "Questionnaire not yet completed" });
      return;
    }

    await db.collection("proposals").doc(req.params.id).update({
      status: "generating",
      updatedAt: new Date().toISOString(),
    });

    let report;
    try {
      report = await generateReport(data.url, questionnaire);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Report generation failed";
      await db.collection("proposals").doc(req.params.id).update({
        status: "error",
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      });
      res.json({ error: message, status: "error" });
      return;
    }

    await db.collection("proposals").doc(req.params.id).update({
      status: "report_ready",
      report,
      updatedAt: new Date().toISOString(),
    });

    res.json({ status: "report_ready", report });
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
