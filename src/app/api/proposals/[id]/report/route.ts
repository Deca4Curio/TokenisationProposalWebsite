import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getDb } from "@/lib/firebase";
import { generateReport } from "@/lib/claude";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const doc = await db.collection("proposals").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = doc.data()!;
    if (data.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use submitted questionnaire if available, otherwise the AI-prefilled one
    const questionnaire = data.questionnaireSubmitted || data.questionnaire;
    if (!questionnaire) {
      return NextResponse.json(
        { error: "Questionnaire not yet completed" },
        { status: 400 }
      );
    }

    await db.collection("proposals").doc(id).update({
      status: "generating",
      updatedAt: new Date().toISOString(),
    });

    let report;
    try {
      report = await generateReport(data.url, questionnaire);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Report generation failed";
      await db.collection("proposals").doc(id).update({
        status: "error",
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({
        error: message,
        status: "error",
      });
    }

    await db.collection("proposals").doc(id).update({
      status: "report_ready",
      report,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ status: "report_ready", report });
  } catch (error) {
    console.error("Generate report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
