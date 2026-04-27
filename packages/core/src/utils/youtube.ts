/**
 * Extracts the 11-character YouTube video ID from various URL formats.
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - VIDEO_ID (if the input is just the ID)
 */
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  
  // Clean input
  const trimmedUrl = url.trim();
  
  // Case 1: Just the ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
    return trimmedUrl;
  }
  
  // Case 2: Standard URLs - Enhanced regex to catch all variants including shorts, embed, v, and parameters
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/v=)([a-zA-Z0-9_-]{11})(?:\S+)?/;
  const match = trimmedUrl.match(regex);
  
  return match ? match[1] : null;
}

/**
 * Standardizes a YouTube URL to a canonical format.
 */
export function getCanonicalYoutubeUrl(url: string): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
