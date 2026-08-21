import type { Readable } from 'node:stream';

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  thumbnail?: string;
  url: string;
  source: 'youtube' | 'local' | 'stream';
  requestedBy?: string;
}

export interface ExtractorResult {
  tracks: TrackMetadata[];
  playlistTitle?: string;
}

export interface BaseExtractor {
  name: string;
  validate(query: string): boolean;
  extract(query: string, requestedBy?: string): Promise<ExtractorResult>;
  createStream(track: TrackMetadata): Promise<Readable>;
}
