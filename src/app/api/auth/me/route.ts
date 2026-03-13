import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getDb } from "@/lib/firebase";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const doc = await getDb().collection("users").doc(userId).get();
    if (!doc.exists) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: { id: userId, ...doc.data() },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ user: null });
  }
}
