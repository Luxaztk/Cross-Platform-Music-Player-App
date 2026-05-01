import React from 'react';
import { Edit2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { useLanguage } from '@hooks';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';
import './DownloadPreviewCard.scss';

interface DownloadPreviewCardProps {
    info: DownloadItem | null;
    onClick?: () => void;
    badgeCount?: number;
    customLabel?: string;
}

export const DownloadPreviewCard: React.FC<DownloadPreviewCardProps> = ({ info, onClick, badgeCount, customLabel }) => {
    const { t } = useLanguage();
    if (!info) return null;

    return (
        <div 
            className={`video-card ${onClick ? 'clickable' : ''} status-${info.status}`} 
            onClick={onClick} 
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="thumbnail-container">
                <img src={info.thumbnail} alt={info.title} />
                {badgeCount && badgeCount > 0 && (
                    <div className="playlist-badge">
                        +{badgeCount}
                    </div>
                )}
                
                <div className="status-overlay-icon">
                    {info.status === DOWNLOAD_STATUS.SUCCESS && <CheckCircle2 size={24} className="success" />}
                    {info.status === DOWNLOAD_STATUS.PENDING && <Clock size={24} className="pending" />}
                    {info.status === DOWNLOAD_STATUS.DOWNLOADING && <Loader2 size={24} className="spinning" />}
                </div>
            </div>
            <div className="video-details">
                <h3>{info.title}</h3>
                <p>{info.artist}</p>
                <div className="metadata-row">
                    <div className="left-meta">
                        <span className="album-tag">{info.album}</span>
                        {info.status !== DOWNLOAD_STATUS.IDLE && (
                            <span className={`status-badge ${info.status}`}>
                                {t(`downloader.status.${info.status}`)}
                            </span>
                        )}
                    </div>
                    {info.status === DOWNLOAD_STATUS.DOWNLOADING && (
                        <span className="progress-text">{Math.round(info.progress)}%</span>
                    )}
                </div>
            </div>

            {info.status === DOWNLOAD_STATUS.DOWNLOADING && (
                <div className="card-progress-bar">
                    <div className="fill" style={{ width: `${info.progress}%` }} />
                </div>
            )}

            {onClick && info.status === DOWNLOAD_STATUS.IDLE && (
                <div className="edit-overlay">
                    <div className="edit-pill">
                        <Edit2 size={ICON_SIZES.TINY} />
                        <span>{customLabel || t('common.edit')}</span>
                    </div>
                </div>
            )}
        </div>
    );
};