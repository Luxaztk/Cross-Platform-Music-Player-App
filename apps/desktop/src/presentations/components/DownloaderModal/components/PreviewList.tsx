import React from 'react';
import { DownloadPreviewCard, DuplicateWarningBanner } from '../..';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';

import type { DuplicateInfo } from '../../../../application/hooks/DownloadContext';

interface PreviewListProps {
  items: DownloadItem[];
  downloadState: string;
  duplicateInfo?: DuplicateInfo | null;
  downloadError?: string | null;
  onItemClick?: (item: DownloadItem) => void;
  t: (keyPath: string, variables?: Record<string, string | number>) => string;
}

export const PreviewList: React.FC<PreviewListProps> = ({
  items,
  downloadState,
  duplicateInfo,
  downloadError,
  onItemClick,
  t
}) => {
  return (
    <div className="downloader-preview-state">
      <div className="preview-items-list">
        {items.map((item) => (
          <DownloadPreviewCard
            key={item.id}
            info={item}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
          />
        ))}
      </div>

      {downloadState === DOWNLOAD_STATUS.PREVIEW && duplicateInfo && (
        <DuplicateWarningBanner duplicateInfo={duplicateInfo} />
      )}

      {downloadState === DOWNLOAD_STATUS.ERROR && downloadError && (
        <div className="downloader-error-state">
          <h3>{t('downloader.error')}</h3>
          <p>{downloadError}</p>
        </div>
      )}
    </div>
  );
};
