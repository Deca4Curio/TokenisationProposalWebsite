import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/api-client";
import { getSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const data = await apiRequest<Record<string, unknown>>(
    "/quotes",
    { method: "POST", body, sessionToken }
  );

  return NextResponse.json(data);
}
