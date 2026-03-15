/**
 * Get a favicon URL for any domain.
 * Uses Google's free favicon API as primary source (works for any public site).
 * Falls back to siteMetadata.favicon from Firecrawl if available.
 */
export function getFaviconUrl(url: string, metadataFavicon?: string): string {
  if (metadataFavicon && metadataFavicon.startsWith("http")) {
    return metadataFavicon;
  }
  try {
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
  } catch {
    return "";
  }
}

/**
 * Get the domain from a URL, stripping protocol and www.
 */
export function getDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
