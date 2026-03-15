import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../lib/firebase.js";
import { scrapeUrl } from "../lib/firecrawl.js";
import { prefillQuestionnaire, generateReport, refineReport, getChangedFields } from "../lib/claude.js";
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
    let scrapeResult;
    try {
      scrapeResult = await scrapeUrl(url);
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

    const { pages: scrapedContent, metadata: siteMetadata } = scrapeResult;

    // AI prefill
    let questionnaire;
    try {
      questionnaire = await prefillQuestionnaire(url, scrapedContent);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI analysis failed";
      await db.collection("proposals").doc(proposalId).update({
        status: "error",
        scrapedContent,
        siteMetadata,
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      });
      res.json({ proposalId, status: "error", errorMessage: message });
      return;
    }

    await db.collection("proposals").doc(proposalId).update({
      status: "questionnaire_ready",
      scrapedContent,
      siteMetadata,
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
// Public access for completed reports (shareable links).
// Auth-gated for in-progress reports (owner only).
router.get("/:id", async (req, res) => {
  try {
    const doc = await getDb().collection("proposals").doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const data = doc.data()!;

    // Completed reports are publicly accessible
    if (data.status === "report_ready") {
      res.json({ proposal: { id: doc.id, ...data } });
      return;
    }

    // In-progress reports require auth + ownership
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
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

// POST /proposals/:id/pregenerate
// Kicks off report generation in background using current questionnaire data.
// Called after wizard Step 3 so the report starts generating while user fills Step 4-5.
router.post("/:id/pregenerate", async (req, res) => {
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

    // Use the partial questionnaire from the request body (company + goals from Steps 2-3)
    // merged with the AI-prefilled defaults for fields the user hasn't touched yet
    const partialQuestionnaire: Questionnaire = {
      ...data.questionnaire,
      ...req.body,
    };

    // Store what we're pre-generating with so we can diff later
    await db.collection("proposals").doc(req.params.id).update({
      pregenerateQuestionnaire: partialQuestionnaire,
      updatedAt: new Date().toISOString(),
    });

    // Respond immediately, generate in background
    res.json({ status: "pregenerating" });

    // Fire and forget: generate report asynchronously
    generateReport(data.url, partialQuestionnaire)
      .then(async (report) => {
        await db.collection("proposals").doc(req.params.id).update({
          pregeneratedReport: report,
          updatedAt: new Date().toISOString(),
        });
        console.log(`Pre-generated report for proposal ${req.params.id}`);
      })
      .catch((err) => {
        console.error(`Pre-generation failed for ${req.params.id}:`, err);
        // Don't set error status - user can still generate normally
      });
  } catch (error) {
    console.error("Pregenerate error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /proposals/:id/report
// Final report generation. If a pre-generated report exists and the questionnaire
// hasn't changed significantly, returns it immediately. If fields changed, refines
// the pre-generated draft. If no pre-generation exists, generates from scratch.
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

    const finalQuestionnaire = data.questionnaireSubmitted || data.questionnaire;
    if (!finalQuestionnaire) {
      res.status(400).json({ error: "Questionnaire not yet completed" });
      return;
    }

    await db.collection("proposals").doc(req.params.id).update({
      status: "generating",
      updatedAt: new Date().toISOString(),
    });

    let report;
    try {
      const pregeneratedReport = data.pregeneratedReport;
      const pregenerateQuestionnaire = data.pregenerateQuestionnaire;

      if (pregeneratedReport && pregenerateQuestionnaire) {
        // We have a pre-generated report. Check if anything changed.
        const changes = getChangedFields(pregenerateQuestionnaire, finalQuestionnaire);
        const changedKeys = Object.keys(changes);

        if (changedKeys.length === 0) {
          // Nothing changed, use pre-generated report as-is
          console.log(`Using pre-generated report for ${req.params.id} (no changes)`);
          report = pregeneratedReport;
        } else {
          // Fields changed, refine the report
          console.log(`Refining pre-generated report for ${req.params.id} (${changedKeys.length} changes: ${changedKeys.join(", ")})`);
          report = await refineReport(data.url, finalQuestionnaire, pregeneratedReport, changes);
        }
      } else {
        // No pre-generated report, generate from scratch
        console.log(`Generating report from scratch for ${req.params.id}`);
        report = await generateReport(data.url, finalQuestionnaire);
      }
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
