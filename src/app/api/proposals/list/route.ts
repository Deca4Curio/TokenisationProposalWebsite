import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/api-client";
import { getSessionToken } from "@/lib/session";

export async function GET() {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const data = await apiRequest<Record<string, unknown>>(
    "/proposals",
    { sessionToken }
  );

  return NextResponse.json(data);
}
