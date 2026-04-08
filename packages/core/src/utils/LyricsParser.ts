export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export class LyricsParser {
  /**
   * Parses an LRC string into an array of LyricLine objects
   */
  static parse(lrc: string): LyricLine[] {
    const lines = lrc.split('\n');
    const result: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

    for (const line of lines) {
      const timeMatches = Array.from(line.matchAll(timeRegex));
      if (timeMatches.length === 0) continue;

      const text = line.replace(timeRegex, '').trim();
      if (!text) continue;

      for (const match of timeMatches) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const msStr = match[3];
        const ms = parseInt(msStr.length === 2 ? msStr + '0' : msStr);
        
        const time = minutes * 60 + seconds + ms / 1000;
        result.push({ time, text });
      }
    }

    return result.sort((a, b) => a.time - b.time);
  }
}
