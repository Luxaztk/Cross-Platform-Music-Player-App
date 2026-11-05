import React from 'react';
import type { Song } from '@music/types';
import { ThemeProvider } from '@components/Theme/ThemeProvider';
import { NowPlaying } from '@components/PlayerBar/components/NowPlaying';
import { PlaybackControls } from '@components/PlayerBar/components/PlaybackControls';
import { ProgressBar } from '@components/PlayerBar/components/ProgressBar';
import { VolumeControl } from '@components/PlayerBar/components/VolumeControl';
import appIconDark from '@music/brand/logos/app_icon_ios_dark.png';
import { useActivityPlayer } from './useActivityPlayer';
import '@components/Theme/ThemeProvider.scss';
import '@components/PlayerBar/PlayerBar.scss';
import './App.scss';

export const ActivityApp: React.FC = () => {
  const player = useActivityPlayer();
  const { playbackState } = player;

  return (
    <ThemeProvider>
      <div className="activity-app main-layout">
        {player.errorMessage && (
          <div className="activity-toast" role="alert">
            <span>⚠️ {player.errorMessage}</span>
            <button type="button" onClick={player.dismissError} aria-label="Đóng thông báo">×</button>
          </div>
        )}

        <header className="activity-header header">
          <div className="activity-brand">
            <img src={appIconDark} alt="MeloVista" />
            <span>MeloVista Player</span>
          </div>

          <div className="activity-search">
            <input
              type="text"
              placeholder={player.isLoading ? '⏳ Đang tải bài hát từ YouTube...' : '🔍 Nhập tên bài hát hoặc URL YouTube...'}
              value={player.searchQuery}
              disabled={player.isLoading || !player.isConnected}
              onChange={(event) => player.setSearchQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && player.playSearch()}
            />
            <button
              type="button"
              className="activity-primary-btn"
              onClick={player.playSearch}
              disabled={player.isLoading || !player.isConnected}
            >
              {player.isLoading ? '⏳ Đang tải...' : '▶ Phát'}
            </button>
          </div>

          <div className="activity-header-actions">
            <button
              type="button"
              className={`activity-secondary-btn${player.showQueue ? ' is-active' : ''}`}
              onClick={() => player.setShowQueue(!player.showQueue)}
            >
              ☰ Hàng đợi ({playbackState.queue.length})
            </button>
            <div className={`activity-connection${player.isConnected ? ' is-online' : ''}`}>
              <span className="activity-connection-dot" />
              {player.isConnected ? 'ONLINE' : 'RECONNECTING'}
            </div>
          </div>
        </header>

        <div className="activity-content">
          <main className={`activity-player${player.showQueue ? ' with-queue' : ''}`}>
            <div className="activity-now-playing-card">
              <div className={`activity-cover${player.isPlaying ? ' is-playing' : ''}`}>
                <img
                  src={playbackState.currentTrack?.coverArt || appIconDark}
                  alt="Ảnh bìa"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2>
                {player.isLoading ? '⏳ Đang tải bài hát...' : playbackState.currentTrack?.title || 'Chưa phát bài hát'}
              </h2>
              <p>
                {player.isLoading
                  ? 'Đang trích xuất stream audio từ YouTube...'
                  : playbackState.currentTrack?.artist || 'Tìm bài hát ở trên hoặc dùng /play trong Discord'}
              </p>
            </div>
          </main>

          {player.showQueue && (
            <aside className="activity-queue-panel">
              <div className="activity-queue-header">
                <strong>📋 Danh sách chờ ({playbackState.queue.length})</strong>
                <div className="activity-queue-header-actions">
                  {playbackState.queue.length > 0 && (
                    <button type="button" onClick={player.clearQueue}>Dọn hàng đợi</button>
                  )}
                  <button type="button" onClick={() => player.setShowQueue(false)} aria-label="Đóng hàng đợi">×</button>
                </div>
              </div>

              <div className="activity-queue-list">
                {playbackState.queue.length === 0 ? (
                  <div className="activity-queue-empty">
                    <span>🎵</span>
                    <strong>Hàng đợi trống</strong>
                    <p>Tìm một bài hát để thêm vào danh sách.</p>
                  </div>
                ) : playbackState.queue.map((track, index) => (
                  <div className="activity-queue-item" key={track.id || `${track.title}-${index}`}>
                    <span className="activity-queue-index">{index + 1}</span>
                    <img src={track.coverArt || track.thumbnail || appIconDark} alt="" referrerPolicy="no-referrer" />
                    <div className="activity-queue-meta">
                      <strong>{track.title}</strong>
                      <span>{track.artist}</span>
                    </div>
                    <span className="activity-queue-duration">
                      {track.duration ? player.formatTime(track.duration) : ''}
                    </span>
                    <div className="activity-queue-actions">
                      <button type="button" onClick={() => player.jumpToQueueItem(index)} title="Phát ngay">▶</button>
                      <button type="button" onClick={() => player.removeQueueItem(index)} title="Xóa khỏi hàng đợi">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>

        <footer className="player-bar activity-player-bar">
          <div className="player-left">
            <NowPlaying isVisible song={playbackState.currentTrack as unknown as Song} appIcon={appIconDark} t={player.t} />
          </div>
          <div className="player-center">
            <div className="player-controls">
              <PlaybackControls
                isVisible
                isPlaying={player.isPlaying}
                isShuffle={playbackState.isShuffle}
                repeatMode={playbackState.loopMode}
                onPlay={player.pauseResume}
                onPause={player.pauseResume}
                onNext={player.skip}
                onPrev={player.previous}
                onToggleShuffle={player.toggleShuffle}
                onToggleRepeat={player.toggleRepeat}
                disabled={!playbackState.currentTrack}
                t={player.t}
              />
            </div>
            <ProgressBar
              isVisible
              progress={player.displayProgressSec}
              duration={playbackState.durationSec}
              percent={player.progressPercent}
              onSeekStart={player.seekStart}
              onSeekChange={player.seekChange}
              onSeekEnd={player.seekEnd}
              formatTime={player.formatTime}
              disabled={!playbackState.currentTrack}
            />
          </div>
          <div className="player-right">
            <VolumeControl
              isVisible
              volume={playbackState.volume / 100}
              percent={playbackState.volume}
              onVolumeChange={player.changeVolume}
              onToggleMute={player.toggleMute}
            />
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default ActivityApp;
