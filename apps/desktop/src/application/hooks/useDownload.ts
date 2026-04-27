import { useContext } from 'react';
import { DownloadContext } from './DownloadContext';

export const useDownload = () => {
    const context = useContext(DownloadContext);
    if (!context) {
        throw new Error('useDownload must be used within a DownloadProvider');
    }
    return context;
};
