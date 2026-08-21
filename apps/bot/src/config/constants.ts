export const BOT_COLORS = {
  PRIMARY: 0x1db954,    // MeloVista Green
  SUCCESS: 0x22c55e,    // Green
  WARNING: 0xeab308,    // Yellow
  ERROR: 0xef4444,      // Red
  NEUTRAL: 0x2b2d31,    // Discord Dark Surface
  ACCENT: 0x6366f1,     // Indigo
} as const;

export const BOT_EMOJIS = {
  MUSIC: '🎵',
  PLAY: '▶️',
  PAUSE: '⏸️',
  SKIP: '⏭️',
  STOP: '⏹️',
  QUEUE: '📜',
  VOLUME: '🔊',
  REPEAT: '🔁',
  SHUFFLE: '🔀',
  SEARCH: '🔍',
  ERROR: '❌',
  SUCCESS: '✅',
  DISC: '💿',
} as const;

export const AUDIO_SPECS = {
  SAMPLE_RATE: 48000,
  CHANNELS: 2,
  FRAME_DURATION: 20, // ms
} as const;
