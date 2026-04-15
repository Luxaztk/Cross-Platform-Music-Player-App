import type { Song } from '@music/types';

/**
 * Interface for a service that extracts metadata from audio files.
 * This allows the Core LibraryService to remain decoupled from the 
 * specific infrastructure (FFmpeg, music-metadata, etc.) used for extraction.
 */
export interface IMetadataService {
  /**
   * Extracts metadata from a file and returns a Song object.
   * 
   * @param filePath Absolute path to the file
   * @param sourceUrl Optional source URL (e.g. YouTube URL)
   * @param originId Optional origin ID (e.g. YouTube Video ID)
   */
  extract(filePath: string, sourceUrl?: string, originId?: string): Promise<Song | null>;
}
