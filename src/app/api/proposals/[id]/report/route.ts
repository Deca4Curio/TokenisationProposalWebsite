import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/api-client";
import { getSessionToken } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const data = await apiRequest<Record<string, unknown>>(
    `/proposals/${id}/report`,
    { method: "POST", sessionToken }
  );

  return NextResponse.json(data);
}
