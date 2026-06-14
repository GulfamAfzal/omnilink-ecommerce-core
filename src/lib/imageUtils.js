/**
 * imageUtils.js — OmniLink Media Asset Resolver
 * Converts Google Drive sharing URLs into direct binary stream anchors.
 *
 * Google Drive sharing URL format:
 *   https://drive.google.com/file/d/[FILE_ID]/view?usp=sharing
 *
 * Resolved direct stream URL:
 *   https://lh3.googleusercontent.com/u/0/d/[FILE_ID]
 */

export const PLACEHOLDER_IMAGE = '/placeholder.svg';

/**
 * Extracts FILE_ID from a Google Drive URL.
 * Supports /file/d/ID/view and /open?id=ID formats.
 */
function extractDriveId(url) {
  if (!url || typeof url !== 'string') return null;

  // Match /file/d/[ID]/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // Match ?id=[ID] or &id=[ID]
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  return null;
}

/**
 * Resolves any image URL to a renderable src string.
 * - Google Drive sharing links → lh3.googleusercontent.com direct stream
 * - Regular URLs → returned as-is
 * - null / empty / invalid → PLACEHOLDER_IMAGE
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return PLACEHOLDER_IMAGE;
  }

  const trimmed = url.trim();

  // Check if it's a Google Drive URL
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com')
  ) {
    const driveId = extractDriveId(trimmed);
    if (driveId) {
      return `https://lh3.googleusercontent.com/u/0/d/${driveId}`;
    }
    // Unrecognized Google Drive format — use placeholder
    return PLACEHOLDER_IMAGE;
  }

  // Already a direct URL — return as-is
  return trimmed;
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
