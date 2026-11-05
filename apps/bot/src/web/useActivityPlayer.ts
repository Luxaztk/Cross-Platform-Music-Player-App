import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RepeatMode } from '@music/hooks';
import { type ActivityTrack, getRepeatMode } from './types';

interface PlaybackState {
  currentTrack: ActivityTrack | null;
  queue: ActivityTrack[];
  volume: number;
  isPaused: boolean;
  progressSec: number;
  durationSec: number;
  loopMode: RepeatMode;
  isShuffle: boolean;
}

interface ActivityStatePayload {
  currentTrack?: ActivityTrack | null;
  queue?: ActivityTrack[];
  volume?: number;
  isPaused?: boolean;
  progressSec?: number;
  durationSec?: number;
  loopMode?: string;
  isShuffle?: boolean;
}

interface ActivityServerMessage {
  type?: string;
  guildId?: string;
  requestId?: string;
  message?: string;
  state?: ActivityStatePayload;
}

const INITIAL_STATE: PlaybackState = {
  currentTrack: null,
  queue: [],
  volume: 80,
  isPaused: false,
  progressSec: 0,
  durationSec: 0,
  loopMode: 'OFF',
  isShuffle: false,
};

const TRANSLATIONS: Record<string, string> = {
  'player.notPlaying': 'Chưa phát bài hát',
  'player.queue': 'Danh sách chờ phát',
  'player.shuffle': 'Phát ngẫu nhiên',
  'player.previous': 'Bài trước',
  'player.play': 'Phát',
  'player.pause': 'Tạm dừng',
  'player.next': 'Bài tiếp theo',
  'player.repeat': 'Lặp lại',
};

const formatTime = (seconds: number): string => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${minutes}:${remainder < 10 ? '0' : ''}${remainder}`;
};

export const useActivityPlayer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(INITIAL_STATE);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreviewSec, setSeekPreviewSec] = useState(0);

  const initialGuildId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('guild_id') || params.get('guildId') || 'default';
  }, []);

  const resolvedGuildIdRef = useRef(initialGuildId);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const isUnmountedRef = useRef(false);
  const isSeekingRef = useRef(false);
  const isAdjustingVolumeRef = useRef(false);
  const volumeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeReleaseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPlayRequestRef = useRef<string | null>(null);

  const sendWsAction = useCallback((action: string, payload: Record<string, unknown> = {}) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: action,
        guildId: resolvedGuildIdRef.current,
        ...payload,
      }));
    }
  }, []);

  useEffect(() => {
    isUnmountedRef.current = false;

    const connectWs = () => {
      if (isUnmountedRef.current) return;

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${location.host}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelayRef.current = 1000;
        ws.send(JSON.stringify({ type: 'JOIN_GUILD', guildId: resolvedGuildIdRef.current }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as ActivityServerMessage;
          if (data.type === 'STATE_UPDATE' && data.state) {
            if (data.guildId) resolvedGuildIdRef.current = data.guildId;
            setPlaybackState((previous) => ({
              ...previous,
              currentTrack: data.state?.currentTrack ?? null,
              queue: data.state?.queue ?? [],
              volume:
                isAdjustingVolumeRef.current || typeof data.state?.volume !== 'number'
                  ? previous.volume
                  : data.state.volume,
              isPaused: data.state?.isPaused ?? false,
              loopMode: getRepeatMode(data.state?.loopMode || previous.loopMode),
              isShuffle: data.state?.isShuffle ?? false,
              progressSec:
                isSeekingRef.current || typeof data.state?.progressSec !== 'number'
                  ? previous.progressSec
                  : data.state.progressSec,
              durationSec:
                typeof data.state?.durationSec === 'number'
                  ? data.state.durationSec
                  : data.state?.currentTrack?.duration ?? previous.durationSec,
            }));
          } else if (data.type === 'PLAY_TRACK_RESULT') {
            if (!data.requestId || data.requestId === pendingPlayRequestRef.current) {
              pendingPlayRequestRef.current = null;
              setIsLoading(false);
            }
          } else if (data.type === 'ERROR') {
            setErrorMessage(data.message || 'Đã xảy ra lỗi khi xử lý yêu cầu');
          }
        } catch (error) {
          console.error('[Activity WebSocket] Invalid server message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsLoading(false);
        pendingPlayRequestRef.current = null;
        wsRef.current = null;
        if (!isUnmountedRef.current) {
          const delay = reconnectDelayRef.current;
          reconnectDelayRef.current = Math.min(delay * 1.5, 5000);
          reconnectTimeoutRef.current = setTimeout(connectWs, delay);
        }
      };

      ws.onerror = () => ws.close();
    };

    connectWs();
    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (volumeDebounceRef.current) clearTimeout(volumeDebounceRef.current);
      if (volumeReleaseRef.current) clearTimeout(volumeReleaseRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const playSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (!query || isLoading || !isConnected) return;
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    pendingPlayRequestRef.current = requestId;
    setIsLoading(true);
    setErrorMessage(null);
    sendWsAction('PLAY_TRACK', { query, requestId });
    setSearchQuery('');
  }, [isConnected, isLoading, searchQuery, sendWsAction]);

  const toggleRepeat = useCallback(() => {
    const nextMode = playbackState.loopMode === 'OFF'
      ? 'track'
      : playbackState.loopMode === 'ONE'
        ? 'queue'
        : 'off';
    sendWsAction('SET_LOOP', { loopMode: nextMode });
    setPlaybackState((previous) => ({ ...previous, loopMode: getRepeatMode(nextMode) }));
  }, [playbackState.loopMode, sendWsAction]);

  const seekStart = useCallback(() => {
    isSeekingRef.current = true;
    setIsSeeking(true);
    setSeekPreviewSec(playbackState.progressSec);
  }, [playbackState.progressSec]);

  const seekChange = useCallback((seconds: number) => {
    const value = Math.max(0, Math.min(seconds, playbackState.durationSec || seconds));
    setSeekPreviewSec(value);
  }, [playbackState.durationSec]);

  const seekEnd = useCallback((seconds: number) => {
    const seekSec = Math.round(Math.max(0, Math.min(seconds, playbackState.durationSec || seconds)));
    setSeekPreviewSec(seekSec);
    setPlaybackState((previous) => ({ ...previous, progressSec: seekSec }));
    isSeekingRef.current = false;
    setIsSeeking(false);
    sendWsAction('SEEK', { seekSec });
  }, [playbackState.durationSec, sendWsAction]);

  const changeVolume = useCallback((value: number) => {
    const volume = Math.round(Math.max(0, Math.min(1, value)) * 100);
    isAdjustingVolumeRef.current = true;
    setPlaybackState((previous) => ({ ...previous, volume }));
    if (volumeDebounceRef.current) clearTimeout(volumeDebounceRef.current);
    if (volumeReleaseRef.current) clearTimeout(volumeReleaseRef.current);
    volumeDebounceRef.current = setTimeout(() => {
      sendWsAction('SET_VOLUME', { volume });
      volumeReleaseRef.current = setTimeout(() => {
        isAdjustingVolumeRef.current = false;
      }, 160);
    }, 80);
  }, [sendWsAction]);

  const toggleMute = useCallback(() => {
    const volume = playbackState.volume === 0 ? 80 : 0;
    changeVolume(volume / 100);
  }, [changeVolume, playbackState.volume]);

  const displayProgressSec = isSeeking ? seekPreviewSec : playbackState.progressSec;
  const progressPercent = playbackState.durationSec > 0
    ? Math.min(100, (displayProgressSec / playbackState.durationSec) * 100)
    : 0;

  return {
    searchQuery,
    setSearchQuery,
    isLoading,
    errorMessage,
    dismissError: () => setErrorMessage(null),
    showQueue,
    setShowQueue,
    isConnected,
    playbackState,
    displayProgressSec,
    progressPercent,
    isPlaying: !playbackState.isPaused && !!playbackState.currentTrack,
    playSearch,
    toggleRepeat,
    seekStart,
    seekChange,
    seekEnd,
    changeVolume,
    toggleMute,
    pauseResume: () => sendWsAction('PAUSE_RESUME'),
    skip: () => sendWsAction('SKIP'),
    previous: () => sendWsAction('PREV_TRACK'),
    toggleShuffle: () => sendWsAction('TOGGLE_SHUFFLE'),
    removeQueueItem: (queueIndex: number) => sendWsAction('REMOVE_QUEUE_ITEM', { queueIndex }),
    jumpToQueueItem: (queueIndex: number) => sendWsAction('JUMP_TO_QUEUE_ITEM', { queueIndex }),
    clearQueue: () => sendWsAction('CLEAR_QUEUE'),
    formatTime,
    t: (key: string) => TRANSLATIONS[key] || key,
  };
};
