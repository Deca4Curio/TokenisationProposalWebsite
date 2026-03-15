import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../lib/firebase.js";
import type { QuoteStatus, QuotePath } from "../types.js";

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

// Midpoint mapping for value ranges
const VALUE_MIDPOINTS: Record<string, number> = {
  "Under CHF 5M": 2_500_000,
  "CHF 5M-25M": 15_000_000,
  "CHF 25M-100M": 62_500_000,
  "CHF 100M-500M": 300_000_000,
  "Over CHF 500M": 750_000_000,
};

// MENA jurisdictions for co-brand detection
const MENA_KEYWORDS = [
  "uae", "dubai", "abu dhabi", "difc", "adgm", "saudi", "bahrain", "qatar",
  "oman", "kuwait", "egypt", "jordan", "lebanon", "iraq", "mena",
];

function detectCoBrand(geography: string): "curioinvest" | "curioinvest_deca4" {
  const lower = geography.toLowerCase();
  return MENA_KEYWORDS.some((kw) => lower.includes(kw))
    ? "curioinvest_deca4"
    : "curioinvest";
}

// POST /quotes — Create quote from proposal data + user input (Step 1)
router.post("/", async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const {
      proposalId,
      companyName,
      companyUrl,
      assetClass,
      assetValueRange,
      geography,
      primaryGoal,
      recipientName,
      recipientEmail,
      recipientRole,
    } = req.body;

    if (!proposalId || !companyName || !assetClass || !assetValueRange || !geography || !primaryGoal) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Verify proposal exists and belongs to user
    const db = getDb();
    const proposalDoc = await db.collection("proposals").doc(proposalId).get();
    if (!proposalDoc.exists) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }
    const proposalData = proposalDoc.data()!;
    if (proposalData.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const quoteId = uuidv4();
    const now = new Date().toISOString();
    const assetValueMid = VALUE_MIDPOINTS[assetValueRange] || 15_000_000;
    const estimatedLiquidityUnlock = assetValueMid * 0.65;
    const coBrand = detectCoBrand(geography);

    // Early bird deadline: 7 days from now
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    const quote = {
      proposalId,
      userId,
      status: "confirmed" as QuoteStatus,
      companyName,
      companyUrl: companyUrl || proposalData.url,
      assetClass,
      assetValueRange,
      assetValueMid,
      estimatedLiquidityUnlock,
      geography,
      primaryGoal,
      recipientName: recipientName || "",
      recipientEmail: recipientEmail || "",
      recipientRole: recipientRole || "",
      coBrand,
      earlyBirdDeadline: deadline.toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("quotes").doc(quoteId).set(quote);

    res.json({ quoteId, ...quote });
  } catch (error) {
    console.error("Create quote error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /quotes/:id — Update quote with path selection (Step 2)
router.put("/:id", async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const db = getDb();
    const doc = await db.collection("quotes").doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }

    const data = doc.data()!;
    if (data.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { path, status, successFeePct, successFeeAmount, discoveryPrice } = req.body as {
      path?: QuotePath;
      status?: QuoteStatus;
      successFeePct?: number;
      successFeeAmount?: number;
      discoveryPrice?: number;
    };

    const update: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (path) update.path = path;
    if (status) update.status = status;
    if (discoveryPrice !== undefined) update.discoveryPrice = discoveryPrice;
    if (successFeePct !== undefined) update.successFeePct = successFeePct;
    if (successFeeAmount !== undefined) update.successFeeAmount = successFeeAmount;

    await db.collection("quotes").doc(req.params.id).update(update);

    res.json({ success: true, quoteId: req.params.id });
  } catch (error) {
    console.error("Update quote error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
