/**
 * imageUtils.js — OmniLink Media Asset Resolver
 * Converts Google Drive sharing URLs into embeddable thumbnail URLs.
 *
 * Supported input formats:
 *   https://drive.google.com/file/d/[FILE_ID]/view?usp=sharing
 *   https://drive.google.com/file/d/[FILE_ID]/view?usp=drive_link
 *   https://drive.google.com/open?id=[FILE_ID]
 *   https://lh3.googleusercontent.com/u/0/d/[FILE_ID]  (previously converted)
 *
 * Resolved direct embeddable URL:
 *   https://drive.google.com/thumbnail?id=[FILE_ID]&sz=w800
 *
 * NOTE: The source file must be shared as "Anyone with the link can view"
 * for the thumbnail URL to work without authentication.
 */

export const PLACEHOLDER_IMAGE = '/placeholder.svg';

/**
 * Extracts FILE_ID from any Google Drive / GoogleUserContent URL variant.
 */
function extractDriveId(url) {
  if (!url || typeof url !== 'string') return null;

  // /file/d/[ID]/view  (standard sharing link)
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // ?id=[ID] or &id=[ID]  (open?id= format)
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // lh3.googleusercontent.com/d/[ID] or /u/0/d/[ID]  (previously converted)
  const lh3Match = url.match(/lh3\.googleusercontent\.com(?:\/u\/\d+)?\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match) return lh3Match[1];

  // thumbnail?id=[ID]  (already a thumbnail URL — re-extract to normalise)
  const thumbMatch = url.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (thumbMatch) return thumbMatch[1];

  return null;
}

/**
 * Resolves any image URL to a browser-renderable src string.
 *
 * Priority:
 *  1. Google Drive URLs → converted to thumbnail API URL (public files only)
 *  2. Regular URLs      → returned as-is
 *  3. null / empty      → PLACEHOLDER_IMAGE
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return PLACEHOLDER_IMAGE;
  }

  const trimmed = url.trim();

  // Detect any Google Drive / GoogleUserContent URL
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('lh3.googleusercontent.com')
  ) {
    const driveId = extractDriveId(trimmed);
    if (driveId) {
      // thumbnail API — works for publicly shared files without auth
      return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
    }
    // Unrecognised Google Drive URL format
    return PLACEHOLDER_IMAGE;
  }

  // Already a direct / CDN URL — return as-is
  return trimmed;
}

/**
 * Server-side helper: same logic as resolveImageUrl but returns null
 * instead of PLACEHOLDER_IMAGE so API routes can distinguish "no image"
 * from "resolved image".
 *
 * Use in Next.js API routes (not in client components).
 */
export function resolveImageUrlServer(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;

  const trimmed = url.trim();

  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('lh3.googleusercontent.com')
  ) {
    const driveId = extractDriveId(trimmed);
    return driveId
      ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`
      : null;
  }

  return trimmed; // regular URL — keep as-is
}

/**
 * onError handler for <img> elements.
 * Falls back to placeholder SVG on broken image load.
 */
export function handleImageError(e) {
  if (e.target.src !== window.location.origin + PLACEHOLDER_IMAGE) {
    e.target.src = PLACEHOLDER_IMAGE;
  }
}
