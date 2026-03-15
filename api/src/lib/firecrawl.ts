import type { ScrapedPage, SiteMetadata } from "../types.js";

const FIRECRAWL_API = "https://api.firecrawl.dev/v1";

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    content?: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
      ogImage?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogSiteName?: string;
      favicon?: string;
      language?: string;
      [key: string]: unknown;
    };
  };
  error?: string;
}

export interface ScrapeResult {
  pages: ScrapedPage[];
  metadata: SiteMetadata;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
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
  const meta = result.data.metadata || {};

  // Build favicon URL: prefer Firecrawl's, fallback to Google API
  const domain = new URL(url).hostname;
  const faviconUrl =
    meta.favicon ||
    `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;

  const metadata: SiteMetadata = {
    ...(meta.ogTitle || meta.title ? { title: meta.ogTitle || meta.title } : {}),
    ...(meta.ogDescription || meta.description ? { description: meta.ogDescription || meta.description } : {}),
    ...(meta.ogImage ? { ogImage: meta.ogImage } : {}),
    favicon: faviconUrl,
    ...(meta.ogSiteName ? { siteName: meta.ogSiteName } : {}),
  };

  return {
    pages: [
      {
        url: meta.sourceURL || url,
        content: truncated,
      },
    ],
    metadata,
  };
}
