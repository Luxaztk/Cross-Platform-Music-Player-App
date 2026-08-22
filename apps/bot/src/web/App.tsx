import React, { useState, useEffect, useRef } from 'react';
import type { Song } from '@music/types';
import type { RepeatMode } from '@music/hooks';
import { type ActivityTrack, getRepeatMode } from './types';
import { ThemeProvider } from '@components/Theme/ThemeProvider';
import { NowPlaying } from '@components/PlayerBar/components/NowPlaying';
import { PlaybackControls } from '@components/PlayerBar/components/PlaybackControls';
import { ProgressBar } from '@components/PlayerBar/components/ProgressBar';
import { VolumeControl } from '@components/PlayerBar/components/VolumeControl';
import appIconDark from '@music/brand/logos/app_icon_ios_dark.png';
import '@components/Theme/ThemeProvider.scss';
import '@components/PlayerBar/PlayerBar.scss';
import '@components/Sidebar/Sidebar.scss';
import '@components/Header/Header.scss';
import '@components/Layout/MainLayout.scss';

export const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [playbackState, setPlaybackState] = useState<{
    currentTrack: ActivityTrack | null;
    queue: ActivityTrack[];
    volume: number;
    isPaused: boolean;
    progressSec: number;
    durationSec: number;
    loopMode: RepeatMode;
    isShuffle: boolean;
  }>({
    currentTrack: null,
    queue: [],
    volume: 80,
    isPaused: false,
    progressSec: 0,
    durationSec: 0,
    loopMode: 'OFF',
    isShuffle: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const isUnmountedRef = useRef(false);

  // DESIGN-04 FIX: Đọc guildId thực từ URL query params
  const guildId = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('guild_id') || params.get('guildId') || 'default';
  }, []);

  // E-04: WebSocket RPC Connection with Exponential Backoff Auto-Reconnect
  useEffect(() => {
    isUnmountedRef.current = false;

    const connectWs = () => {
      if (isUnmountedRef.current) return;

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${location.host}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelayRef.current = 1000;
        ws.send(JSON.stringify({ type: 'JOIN_GUILD', guildId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATE_UPDATE' && data.state) {
            setIsLoading(false);
            setPlaybackState((prev) => ({
              ...prev,
              currentTrack: data.state.currentTrack || null,
              queue: data.state.queue || [],
              volume: data.state.volume ?? prev.volume,
              isPaused: data.state.isPaused ?? false,
              loopMode: getRepeatMode(data.state.loopMode),
              isShuffle: data.state.isShuffle || false,
              progressSec: typeof data.state.progressSec === 'number' ? data.state.progressSec : prev.progressSec,
              durationSec:
                typeof data.state.durationSec === 'number'
                  ? data.state.durationSec
                  : data.state.currentTrack?.duration || prev.durationSec,
            }));
          } else if (data.type === 'ERROR') {
            // E-03: Nhận thông báo lỗi từ server và hiển thị toast
            setIsLoading(false);
            setErrorMessage(data.message || 'Đã xảy ra lỗi khi xử lý yêu cầu');
          }
        } catch (e) {
          console.error('[WebSocket onmessage error]', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (!isUnmountedRef.current) {
          const delay = reconnectDelayRef.current;
          reconnectDelayRef.current = Math.min(delay * 1.5, 5000);
          reconnectTimeoutRef.current = setTimeout(connectWs, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [guildId]);

  // E-03: Tự động ẩn thông báo lỗi sau 4 giây
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const sendWsAction = (action: string, payload: Record<string, unknown> = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: action, guildId, ...payload }));
    }
  };

  // E-08: Client debounce search
  const handlePlaySearch = () => {
    if (!searchQuery.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    sendWsAction('PLAY_TRACK', { query: searchQuery.trim() });
    setSearchQuery('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const dummyT = (key: string) => {
    const map: Record<string, string> = {
      'player.notPlaying': 'Chưa phát bài hát',
      'player.queue': 'Danh sách chờ phát',
    };
    return map[key] || key;
  };

  const isPlaying = !playbackState.isPaused && !!playbackState.currentTrack;
  const progressPercent =
    playbackState.durationSec > 0 ? (playbackState.progressSec / playbackState.durationSec) * 100 : 0;

  // DESIGN-08: Tính toán loop mode tiếp theo theo chu kỳ OFF → ONE → ALL → OFF
  const handleToggleRepeat = () => {
    const modeMap: Record<string, string> = { OFF: 'track', ONE: 'queue', ALL: 'off' };
    const serverModeMap: Record<string, string> = { off: 'OFF', track: 'ONE', queue: 'ALL' };
    const nextServerMode = modeMap[playbackState.loopMode] || 'off';
    sendWsAction('SET_LOOP', { loopMode: nextServerMode });
    setPlaybackState((prev) => ({ ...prev, loopMode: serverModeMap[nextServerMode] as 'OFF' | 'ONE' | 'ALL' }));
  };

  return (
    <ThemeProvider>
      <div className="main-layout" style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* E-03: Floating Error Toast */}
        {errorMessage && (
          <div
            style={{
              position: 'fixed',
              top: '72px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              background: 'rgba(239, 68, 68, 0.95)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <span>⚠️ {errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', marginLeft: '8px' }}
            >
              ✕
            </button>
          </div>
        )}

        <header
          className="header"
          style={{
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
            <img src={appIconDark} alt="Logo" style={{ width: '28px', height: '28px' }} />
            <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--color-primary)' }}>MeloVista Player</span>
          </div>

          {/* Integrated Search Bar */}
          <div style={{ flex: 1, maxWidth: '480px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={isLoading ? '⏳ Đang tải bài hát từ YouTube...' : '🔍 Nhập tên bài hát hoặc URL YouTube...'}
              value={searchQuery}
              disabled={isLoading}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlaySearch()}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--color-text-main)',
                fontSize: '13px',
                outline: 'none',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
            <button
              type="button"
              onClick={handlePlaySearch}
              disabled={isLoading}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: 'none',
                background: isLoading ? 'var(--color-text-muted)' : 'var(--color-primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? '⏳ Đang tải...' : '▶ Phát'}
            </button>
          </div>

          {/* Header Controls: Queue Toggle & Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px', justifyContent: 'flex-end' }}>
            {/* E-01: Toggle Queue Button */}
            <button
              type="button"
              onClick={() => setShowQueue(!showQueue)}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                background: showQueue ? 'var(--color-primary)' : 'var(--bg-surface)',
                color: showQueue ? '#fff' : 'var(--color-text-main)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>☰</span>
              <span>Hàng đợi ({playbackState.queue.length})</span>
            </button>

            <div
              style={{
                fontSize: '11px',
                color: isConnected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: 'var(--bg-surface)',
                padding: '4px 10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? 'var(--color-primary)' : '#ef4444' }} />
              {isConnected ? 'ONLINE' : 'RECONNECTING'}
            </div>
          </div>
        </header>

        {/* Mid Area with adaptive layout: Hero Player + E-01 Queue Panel */}
        <div className="layout-mid" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '20px', gap: '20px' }}>
          {/* Main Hero Player Section */}
          <main
            className="main-area"
            style={{
              flex: showQueue ? 1 : 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              className="now-playing-hero"
              style={{
                background: 'var(--bg-surface-solid)',
                padding: '36px 48px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)',
                textAlign: 'center',
                maxWidth: '420px',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  overflow: 'hidden',
                  border: '4px solid var(--color-primary)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                  animation: isPlaying ? 'spin 12s linear infinite' : 'none',
                }}
              >
                <img
                  src={playbackState.currentTrack?.coverArt || appIconDark}
                  alt="Cover"
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '8px' }}>
                {isLoading ? '⏳ Đang tải bài hát...' : playbackState.currentTrack?.title || 'Chưa phát bài hát'}
              </h2>
              <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '13px' }}>
                {isLoading
                  ? 'Đang trích xuất stream audio từ YouTube...'
                  : playbackState.currentTrack?.artist || 'Mở nhạc bằng thanh tìm kiếm ở trên hoặc gõ /play trong chat'}
              </p>
            </div>
          </main>

          {/* E-01: Interactive Queue Side Panel */}
          {showQueue && (
            <aside
              style={{
                flex: 1,
                maxWidth: '380px',
                background: 'var(--bg-surface-solid)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                animation: 'slideIn 0.25s ease',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-main)' }}>
                  📋 Danh Sách Chờ ({playbackState.queue.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowQueue(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '16px' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {playbackState.queue.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 16px', fontSize: '13px' }}>
                    <p style={{ fontSize: '28px', marginBottom: '8px' }}>🎵</p>
                    <p style={{ fontWeight: 600 }}>Hàng đợi trống</p>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Nhập tên bài hát ở thanh tìm kiếm phía trên để thêm vào danh sách.</p>
                  </div>
                ) : (
                  playbackState.queue.map((track, idx) => (
                    <div
                      key={track.id || `${track.title}-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', width: '20px', textAlign: 'center' }}>
                        {idx + 1}
                      </span>
                      <img
                        src={track.coverArt || track.thumbnail || appIconDark}
                        alt="thumb"
                        referrerPolicy="no-referrer"
                        style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--color-text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {track.title}
                        </p>
                        <p
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {track.artist}
                        </p>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', paddingLeft: '4px' }}>
                        {track.duration ? formatTime(track.duration) : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </aside>
          )}
        </div>

        <footer className="player-bar">
          <div className="player-left">
            <NowPlaying isVisible={true} song={playbackState.currentTrack as unknown as Song} appIcon={appIconDark} t={dummyT} />
          </div>

          <div className="player-center">
            <div className="player-controls">
              <PlaybackControls
                isVisible={true}
                isPlaying={isPlaying}
                isShuffle={playbackState.isShuffle}
                repeatMode={getRepeatMode(playbackState.loopMode)}
                onPlay={() => sendWsAction('PAUSE_RESUME')}
                onPause={() => sendWsAction('PAUSE_RESUME')}
                onNext={() => sendWsAction('SKIP')}
                onPrev={() => sendWsAction('PREV_TRACK')}
                onToggleShuffle={() => sendWsAction('TOGGLE_SHUFFLE')}
                onToggleRepeat={handleToggleRepeat}
                disabled={!playbackState.currentTrack}
                t={dummyT}
              />
            </div>

            <ProgressBar
              isVisible={true}
              progress={playbackState.progressSec}
              duration={playbackState.durationSec}
              percent={progressPercent}
              onSeekStart={() => {}}
              onSeekChange={() => {}}
              onSeekEnd={(val) => {
                const seekSec = Math.round((val / 100) * playbackState.durationSec);
                sendWsAction('SEEK', { seekSec });
              }}
              formatTime={formatTime}
              disabled={!playbackState.currentTrack}
            />
          </div>

          <div className="player-right">
            <VolumeControl
              isVisible={true}
              volume={playbackState.volume / 100}
              percent={playbackState.volume}
              onVolumeChange={(val) => {
                const volInt = Math.round(val * 100);
                setPlaybackState((prev) => ({ ...prev, volume: volInt }));
                sendWsAction('SET_VOLUME', { volume: volInt });
              }}
              onToggleMute={() => {
                const newVol = playbackState.volume === 0 ? 80 : 0;
                setPlaybackState((prev) => ({ ...prev, volume: newVol }));
                sendWsAction('SET_VOLUME', { volume: newVol });
              }}
            />
          </div>
        </footer>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ThemeProvider>
  );
};

export default App;
