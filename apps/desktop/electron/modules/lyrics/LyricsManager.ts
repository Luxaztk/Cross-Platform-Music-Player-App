import axios from 'axios';
import type { Song, LyricSearchResult } from '@music/types';
import { MetadataManager } from '../metadata/MetadataManager';
import { cleanLyricsTitle, normalizeNFC, getPrimaryArtist } from '@music/utils';

export class LyricsManager {
  private apiBase = 'https://lrclib.net/api';
  private metadataManager: MetadataManager;

  constructor() {
    this.metadataManager = new MetadataManager();
  }

  /**
   * Automatically find and embed lyrics for a song
   */
  public async autoFetchAndEmbed(song: Song): Promise<boolean> {
    try {
      const cleanTitle = cleanLyricsTitle(song.title);
      const cleanArtist = getPrimaryArtist(song.artist); // Validate artist
      
      const params = {
        track_name: cleanTitle,
        artist_name: cleanArtist,
        duration: Math.floor(song.duration),
      };

      const response = await axios.get(`${this.apiBase}/get`, { params });
      
      if (response.data && response.data.syncedLyrics) {
        await this.metadataManager.writeMetadata(song.filePath, {
          syncedLyrics: response.data.syncedLyrics,
          lyrics: response.data.plainLyrics
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[LyricsManager] Auto fetch failed for ${song.title}:`, (error as any).message);
      return false;
    }
  }

  /**
   * Search lyrics manually using a query string
   */
  public async search(query: string): Promise<LyricSearchResult[]> {
    try {
      const validatedQuery = normalizeNFC(query); // Ensure query is clean
      console.log(`[LyricsManager] Searching for: "${validatedQuery}"`);
      
      const response = await axios.get(`${this.apiBase}/search`, { 
        params: { q: validatedQuery },
        timeout: 10000 // 10s timeout
      });
      
      console.log(`[LyricsManager] API Status: ${response.status}`);
      console.log(`[LyricsManager] Found ${response.data?.length || 0} results`);
      
      return response.data.map((item: any) => ({
        id: item.id,
        trackName: item.trackName,
        artistName: item.artistName,
        albumName: item.albumName,
        duration: item.duration,
        syncedLyrics: item.syncedLyrics,
        plainLyrics: item.plainLyrics
      }));
    } catch (error: any) {
      console.error('[LyricsManager] Search failed:', error.message);
      if (error.response) {
        console.error('[LyricsManager] API Error Data:', error.response.data);
      }
      return [];
    }
  }

  /**
   * Save specific lyrics to a song file
   */
  public async saveLyrics(filePath: string, syncedLyrics: string, lyricId?: number): Promise<boolean> {
    try {
      console.log(`[LyricsManager] Attempting to save lyrics to: ${filePath}`);
      // Create a plain text version for basic USLT support
      const lyrics = syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
      
      const success = await this.metadataManager.writeMetadata(filePath, {
        syncedLyrics,
        lyrics,
        lyricId: lyricId?.toString()
      });

      console.log(`[LyricsManager] Save operation result: ${success}`);
      return success;
    } catch (error) {
      console.error('[LyricsManager] Save failed:', error);
      return false;
    }
  }
}
