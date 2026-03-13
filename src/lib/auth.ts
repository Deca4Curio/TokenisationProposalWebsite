import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "./firebase";

const SESSION_COOKIE = "session_token";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string): Promise<string> {
  const token = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await getDb().collection("sessions").doc(token).set({
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return token;
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const doc = await getDb().collection("sessions").doc(token).get();
  if (!doc.exists) return null;

  const session = doc.data()!;
  if (new Date(session.expiresAt) < new Date()) {
    await doc.ref.delete();
    return null;
  }

  return session.userId;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().collection("sessions").doc(token).delete();
    cookieStore.delete(SESSION_COOKIE);
  }
}
