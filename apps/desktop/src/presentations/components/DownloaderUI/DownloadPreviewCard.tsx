import React from 'react';
import type { YouTubeVideoInfo } from '@hooks';

interface DownloadPreviewCardProps {
    info: YouTubeVideoInfo | null;
}

export const DownloadPreviewCard: React.FC<DownloadPreviewCardProps> = ({ info }) => {
    if (!info) return null;

    return (
        <div className="video-card">
            <div className="thumbnail-container">
                <img src={info.thumbnail} alt={info.title} />
            </div>
            <div className="video-details">
                <h3>{info.title}</h3>
                <p>{info.artist}</p>
                <span className="album-tag">{info.album}</span>
            </div>
        </div>
    );
};