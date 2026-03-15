import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/api-client";
import { getSessionToken } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionToken = await getSessionToken();
  const { id } = await params;

  // Pass session token if available; the API handles public vs auth-gated access
  const data = await apiRequest<Record<string, unknown>>(
    `/proposals/${id}`,
    { ...(sessionToken ? { sessionToken } : {}) }
  );

  return NextResponse.json(data);
}
