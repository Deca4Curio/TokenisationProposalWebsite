import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/api-client";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const data = await apiRequest<{ userId?: string; email?: string; sessionToken?: string; error?: string }>(
    "/auth/signup",
    { method: "POST", body }
  );

  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 400 });
  }

  if (data.sessionToken) {
    await setSessionCookie(data.sessionToken);
  }

  return NextResponse.json({ userId: data.userId, email: data.email });
}
