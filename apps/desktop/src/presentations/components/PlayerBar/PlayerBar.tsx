import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, ListMusic, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayer } from '@music/hooks';
import { ICON_SIZES } from '../../constants/IconSizes';
import './PlayerBar.scss';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const PlayerBar: React.FC = () => {
  const { 
    currentSong, isPlaying, play, pause, next, prev, progress, duration, 
    volume, setVolume, seek, queue, 
    isShuffle, toggleShuffle, repeatMode, setRepeatMode 
  } = usePlayer();
  
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else if (currentSong) play();
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 1);
  };

  const toggleRepeat = () => {
    if (repeatMode === 'OFF') setRepeatMode('ALL');
    else if (repeatMode === 'ALL') setRepeatMode('ONE');
    else setRepeatMode('OFF');
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;
  const volumePercent = volume * 100;

  return (
    <div className="player-bar">
      <div className="player-left">
        <div className="now-playing">
          {currentSong?.coverArt ? (
            <div className="cover-art" style={{ backgroundImage: `url(${currentSong.coverArt})` }}></div>
          ) : (
            <div className="cover-art-mock">
              <Music size={ICON_SIZES.LARGE} />
            </div>
          )}
          <div className="song-meta">
            <div className="song-title">{currentSong?.title || 'No track playing'}</div>
            <div className="song-artist">{currentSong?.artist || '-'}</div>
          </div>
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button className={`control-btn secondary-btn ${isShuffle ? 'active' : ''}`} title="Shuffle" onClick={toggleShuffle}>
            <Shuffle size={16} />
          </button>
          <button className="control-btn" title="Previous" onClick={prev} disabled={!currentSong}>
            <SkipBack size={ICON_SIZES.MEDIUM} fill={currentSong ? "currentColor" : "none"} />
          </button>
          <button className="control-btn play-btn" title={isPlaying ? "Pause" : "Play"} onClick={handlePlayPause} disabled={!currentSong}>
            {isPlaying ? (
              <Pause size={ICON_SIZES.MEDIUM} fill="currentColor" />
            ) : (
              <Play size={ICON_SIZES.MEDIUM} fill="currentColor" />
            )}
          </button>
          <button className="control-btn" title="Next" onClick={next} disabled={!currentSong && queue.length === 0}>
            <SkipForward size={ICON_SIZES.MEDIUM} fill={queue.length > 0 || currentSong ? "currentColor" : "none"} />
          </button>
          <button className={`control-btn secondary-btn ${repeatMode !== 'OFF' ? 'active' : ''}`} title="Repeat" onClick={toggleRepeat}>
            {repeatMode === 'ONE' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>
        
        <div className="playback-bar">
          <span className="time-current">{formatTime(progress)}</span>
          <input 
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={progress || 0}
            onChange={handleSeekChange}
            className="styled-range progress-range"
            style={{ '--range-progress': `${progressPercent}%` } as React.CSSProperties}
            disabled={!currentSong || !duration}
          />
          <span className="time-total">{formatTime(duration || currentSong?.duration || 0)}</span>
        </div>
      </div>

      <div className="player-right">
        <button className={`queue-info ${isQueueOpen ? 'active' : ''}`} title="Queue Items" onClick={() => setIsQueueOpen(!isQueueOpen)}>
          <ListMusic size={ICON_SIZES.SMALL} />
          <span className="queue-count">{queue.length}</span>
        </button>
        
        {/* Simplified Queue Popover logic for MVP UI */}
        {isQueueOpen && (
          <div className="queue-popover">
            <div className="queue-header">
              <h3>Up Next</h3>
              <span className="queue-total">{queue.length} tracks</span>
            </div>
            <div className="queue-list">
              {queue.length === 0 ? (
                <div className="queue-empty">Queue is empty</div>
              ) : (
                queue.slice(0, 50).map((song, idx) => (
                  <div key={`${song.id}-${idx}`} className="queue-item">
                    <div className="queue-item-info">
                      <div className="queue-item-title">{song.title}</div>
                      <div className="queue-item-artist">{song.artist}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="volume-control">
          <button className="control-btn" onClick={toggleMute} style={{ padding: 0 }}>
            {volume === 0 ? <VolumeX className="volume-icon" size={ICON_SIZES.SMALL} /> : <Volume2 className="volume-icon" size={ICON_SIZES.SMALL} />}
          </button>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="styled-range volume-range"
            style={{ '--range-progress': `${volumePercent}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
