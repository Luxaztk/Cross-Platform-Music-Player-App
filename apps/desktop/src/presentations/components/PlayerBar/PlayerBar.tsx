import React, { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume, Volume1, Volume2, VolumeX, ListMusic, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayer } from '@music/hooks';
import { formatTime } from '@music/utils';
import { ICON_SIZES } from '../../constants/IconSizes';
import { useTheme } from '../Theme';
import QueuePanel from './QueuePanel';
import './PlayerBar.scss';


const PlayerBar: React.FC = () => {
  const { 
    currentSong, isPlaying, play, pause, next, prev, progress, duration, 
    volume, setVolume, seek, queue, 
    isShuffle, toggleShuffle, repeatMode, setRepeatMode 
  } = usePlayer();
  
  const { appIcon } = useTheme();
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const queueContainerRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // Close queue popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isQueueOpen &&
        queueContainerRef.current &&
        !queueContainerRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        setIsQueueOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQueueOpen]);

  const isSeeking = useRef(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [lastVolume, setLastVolume] = useState(1);

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else if (currentSong) play();
  };

  const handleSeekStart = () => {
    isSeeking.current = true;
    setLocalProgress(progress);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalProgress(val);
  };

  const handleSeekEnd = (e: React.PointerEvent<HTMLInputElement>) => {
    if (isSeeking.current) {
      const val = parseFloat(e.currentTarget.value);
      seek(val);
      isSeeking.current = false;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setLastVolume(val);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setLastVolume(volume);
      setVolume(0);
    } else {
      setVolume(lastVolume || 1);
    }
  };

  const toggleRepeat = () => {
    if (repeatMode === 'OFF') setRepeatMode('ALL');
    else if (repeatMode === 'ALL') setRepeatMode('ONE');
    else setRepeatMode('OFF');
  };

  const displayProgress = isSeeking.current ? localProgress : progress;
  const progressPercent = duration ? (displayProgress / duration) * 100 : 0;
  const volumePercent = volume * 100;

  return (
    <div className="player-bar">
      <div className="player-left">
        <div className="now-playing">
          {currentSong?.coverArt ? (
            <div className="cover-art">
              <img src={currentSong.coverArt} alt={currentSong.title} />
            </div>
          ) : (
            <div className="cover-art-mock">
               <img src={appIcon} alt="" className="placeholder-brand-icon-mini" />
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
          <span className="time-current">{formatTime(displayProgress)}</span>
          <input 
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={displayProgress || 0}
            onPointerDown={handleSeekStart}
            onChange={handleSeekChange}
            onPointerUp={handleSeekEnd}
            className="styled-range progress-range"
            style={{ '--range-progress': `${progressPercent}%` } as React.CSSProperties}
            disabled={!currentSong || !duration}
          />
          <span className="time-total">{formatTime(duration || currentSong?.duration || 0)}</span>
        </div>
      </div>

      <div className="player-right">
        <button 
          ref={toggleBtnRef}
          className={`queue-info ${isQueueOpen ? 'active' : ''}`} 
          title="Queue Items" 
          onClick={() => setIsQueueOpen(!isQueueOpen)}
        >
          <ListMusic size={ICON_SIZES.SMALL} />
          <span className="queue-count">{queue.length}</span>
        </button>
        
        {/* Advanced Queue Popover with Drag & Drop */}
        {isQueueOpen && (
          <div ref={queueContainerRef}>
            <QueuePanel />
          </div>
        )}

        <div className="volume-control">
          <button className="control-btn volume-btn" onClick={toggleMute} title={volume === 0 ? "Unmute" : "Mute"}>
            {volume === 0 ? (
              <VolumeX size={ICON_SIZES.SMALL} />
            ) : volume < 0.3 ? (
              <Volume size={ICON_SIZES.SMALL} />
            ) : volume < 0.7 ? (
              <Volume1 size={ICON_SIZES.SMALL} />
            ) : (
              <Volume2 size={ICON_SIZES.SMALL} />
            )}
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
