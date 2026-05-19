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

    const isEditable = info.status === DOWNLOAD_STATUS.PREVIEW;
    const finalOnClick = isEditable ? onClick : undefined;

    return (
        <div 
            className={`video-card ${finalOnClick ? 'clickable' : ''} status-${info.status}`} 
            onClick={finalOnClick} 
            role={finalOnClick ? 'button' : undefined}
            tabIndex={finalOnClick ? 0 : undefined}
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
                <div className="video-artist">
                    {info.artist?.split(/(\s(?:ft\.?|x|&|and)\s|,\s?)/i).map((part, i) => {
                        const isSeparator = /(\s(?:ft\.?|x|&|and)\s|,\s?)/i.test(part);
                        return (
                            <span key={i} className={isSeparator ? 'artist-separator' : 'artist-name'}>
                                {part}
                            </span>
                        );
                    })}
                </div>

                <div className="metadata-row">
                    <div className="left-meta">
                        <span className="album-tag">{info.album}</span>
                        {info.status !== DOWNLOAD_STATUS.IDLE && info.status !== DOWNLOAD_STATUS.PREVIEW && (
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

            {finalOnClick && (
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