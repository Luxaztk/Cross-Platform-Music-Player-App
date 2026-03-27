import React from 'react';
import { useLibrary } from '../../../application/hooks';
import { useNavigate } from 'react-router-dom';
import './PlaylistsPage.scss';

export const PlaylistsPage: React.FC = () => {
  const { playlists } = useLibrary();
  const navigate = useNavigate();

  return (
    <div className="playlists-page">
      <div className="header">
        <h1>Playlists</h1>
        <button 
          className="create-btn"
          onClick={() => alert('Feature coming soon!')}
        >
          + Create Playlist
        </button>
      </div>

      <div className="playlists-grid">
        {playlists.map(pl => (
          <div 
            key={pl.id}
            className="playlist-card"
            onClick={() => navigate(`/playlist/${pl.id}`)}
          >
            <div className="playlist-thumb">
              🎵
            </div>
            <h3 className="playlist-name">{pl.name}</h3>
            <p className="playlist-desc">{pl.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
