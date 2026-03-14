import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/api-client";
import { getSessionToken } from "@/lib/session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const data = await apiRequest<Record<string, unknown>>(
    `/proposals/${id}/questionnaire`,
    { method: "PUT", body, sessionToken }
  );

  return NextResponse.json(data);
}
