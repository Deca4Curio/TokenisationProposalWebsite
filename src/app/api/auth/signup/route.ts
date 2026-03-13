import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/firebase";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const db = getDb();

    // Check if user exists
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

    await createSession(userId);

    return NextResponse.json({ userId, email: trimmed });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
