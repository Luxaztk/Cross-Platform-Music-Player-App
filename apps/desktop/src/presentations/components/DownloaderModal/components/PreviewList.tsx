import React from 'react';
import { DownloadPreviewCard, DuplicateWarningBanner } from '@components';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';

interface PreviewListProps {
  items: DownloadItem[];
  downloadState: string;
  duplicateInfo?: any;
  downloadError?: string | null;
  onItemClick?: (item: DownloadItem) => void;
  t: (key: string, options?: any) => string;
}

export const PreviewList: React.FC<PreviewListProps> = ({
  items,
  downloadState,
  duplicateInfo,
  onItemClick
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
    </div>
  );
};
