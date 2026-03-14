import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/api-client";
import { getSessionToken } from "@/lib/session";

export async function GET() {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    return NextResponse.json({ user: null });
  }

  const data = await apiRequest<{ user: unknown }>(
    "/auth/me",
    { sessionToken }
  );

  return NextResponse.json(data);
}
