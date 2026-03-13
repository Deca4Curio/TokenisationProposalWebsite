import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getDb } from "@/lib/firebase";
import type { Questionnaire } from "@/types";

export async function PUT(
  request: Request,
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

    const questionnaire: Questionnaire = await request.json();

    await db.collection("proposals").doc(id).update({
      questionnaireSubmitted: questionnaire,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update questionnaire error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
