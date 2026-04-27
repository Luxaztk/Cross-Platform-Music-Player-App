import React from 'react';
import { useLanguage } from '@hooks';
interface DownloadProgressBarProps {
    progress: number;
    title?: string;
}

export const DownloadProgressBar: React.FC<DownloadProgressBarProps> = ({ progress, title }) => {
    const { t } = useLanguage();
    const isConverting = progress >= 99.9;

    return (
        <div className="downloader-progress-state">
            <div className="progress-info">
                <p>{isConverting ? t('downloader.converting') : t('downloader.downloading')}</p>
                <span className="percent">{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%`, transition: isConverting ? 'none' : 'width 0.3s ease' }}
                />
            </div>
            <p className="song-title-scrolling">{title}</p>
        </div>
    );
};