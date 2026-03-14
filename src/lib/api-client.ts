const API_URL = process.env.CLOUD_RUN_API_URL || "http://localhost:8080";
const API_SECRET = process.env.API_SECRET || "";

interface ApiOptions {
  method?: string;
  body?: unknown;
  sessionToken?: string;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, sessionToken } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Secret": API_SECRET,
  };

  if (sessionToken) {
    headers["X-Session-Token"] = sessionToken;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json() as Promise<T>;
}
