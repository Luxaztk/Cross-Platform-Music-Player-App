import path from 'node:path';

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
 * handling Windows/POSIX case sensitivity and slash differences.
 */
export const isSamePath = (pathA: string, pathB: string): boolean => {
  if (!pathA || !pathB) return false;
  try {
    return path.resolve(pathA).toLowerCase() === path.resolve(pathB).toLowerCase();
  } catch (err) {
    // Fallback for non-standard paths or environments where path.resolve might fail
    return pathA.toLowerCase() === pathB.toLowerCase();
  }
};
