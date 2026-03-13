import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUserId } from "@/lib/auth";
import { getDb } from "@/lib/firebase";
import { scrapeUrl } from "@/lib/firecrawl";
import { prefillQuestionnaire } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const proposalId = uuidv4();
    const now = new Date().toISOString();
    const db = getDb();

    // Create proposal in scraping state
    await db.collection("proposals").doc(proposalId).set({
      userId,
      url,
      status: "scraping",
      createdAt: now,
      updatedAt: now,
    });

    // Scrape URL
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
      return NextResponse.json({ proposalId, status: "error", errorMessage: message });
    }

    // AI prefill questionnaire
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
      return NextResponse.json({ proposalId, status: "error", errorMessage: message });
    }

    // Update proposal with results
    await db.collection("proposals").doc(proposalId).update({
      status: "questionnaire_ready",
      scrapedContent,
      questionnaire,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      proposalId,
      status: "questionnaire_ready",
      questionnaire,
    });
  } catch (error) {
    console.error("Create proposal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
