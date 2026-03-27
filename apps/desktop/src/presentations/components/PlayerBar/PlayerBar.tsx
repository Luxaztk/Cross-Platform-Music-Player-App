import React from 'react';
import { Play, SkipBack, SkipForward, Volume2, Music } from 'lucide-react';
import { ICON_SIZES } from '../../constants/IconSizes';
import './PlayerBar.scss';

const PlayerBar: React.FC = () => {
  return (
    <div className="player-bar">
      <div className="player-left">
        {/* Mock Song Info */}
        <div className="now-playing">
          <div className="cover-art-mock">
            <Music size={ICON_SIZES.LARGE} />
          </div>
          <div className="song-meta">
            <div className="song-title">Song Title</div>
            <div className="song-artist">Artist Name</div>
          </div>
        </div>
      </div>

      <div className="player-center">
        {/* Mock Controls */}
        <div className="player-controls">
          <button className="control-btn" title="Previous">
            <SkipBack size={ICON_SIZES.MEDIUM} fill="currentColor" />
          </button>
          <button className="control-btn play-btn" title="Play">
            <Play size={ICON_SIZES.MEDIUM} fill="currentColor" />
          </button>
          <button className="control-btn" title="Next">
            <SkipForward size={ICON_SIZES.MEDIUM} fill="currentColor" />
          </button>
        </div>
        <div className="playback-bar">
          <span className="time-current">0:00</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '0%' }}></div>
          </div>
          <span className="time-total">3:45</span>
        </div>
      </div>

      <div className="player-right">
        {/* Mock Volume */}
        <div className="volume-control">
          <Volume2 className="volume-icon" size={ICON_SIZES.SMALL} />
          <div className="progress-bar volume-bar">
            <div className="progress-fill" style={{ width: '50%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
