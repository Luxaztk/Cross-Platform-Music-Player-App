/**
 * Normalizes a string for comparison by removing Vietnamese accents,
 * converting to lowercase, and removing special characters.
 */
export const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters but keep spaces and alphanumeric
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

/**
 * Standardizes and compares two file paths for equality, 
 * handling Windows/POSIX case sensitivity and slash differences
 * without relying on node:path to remain cross-platform (React Native compatible).
 */
export const isSamePath = (pathA: string, pathB: string): boolean => {
  if (!pathA || !pathB) return false;
  
  const normalizePath = (p: string) => {
    return p
      .replace(/\\/g, '/') // Convert Windows slashes to POSIX
      .replace(/\/+/g, '/') // Remove duplicate slashes
      .replace(/\/+$/, '') // Remove trailing slashes
      .toLowerCase(); // Case-insensitive for Windows compatibility
  };
  
  return normalizePath(pathA) === normalizePath(pathB);
};
