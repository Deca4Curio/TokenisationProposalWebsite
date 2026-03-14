import type { ScrapedPage } from "../types.js";

const FIRECRAWL_API = "https://api.firecrawl.dev/v1";

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    content?: string;
    metadata?: {
      title?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

export async function scrapeUrl(url: string): Promise<ScrapedPage[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");

  const response = await fetch(`${FIRECRAWL_API}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 30000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl error ${response.status}: ${text}`);
  }

  const result: FirecrawlResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Firecrawl returned no data");
  }

  const content = result.data.markdown || result.data.content || "";
  const truncated = content.slice(0, 8000);

  return [
    {
      url: result.data.metadata?.sourceURL || url,
      content: truncated,
    },
  ];
}
