import React from 'react';
import { UploadCloud, Folder, FileMusic, Loader2 } from 'lucide-react';
import { useLanguage } from '@hooks';
import './EmptyState.scss';

interface EmptyStateProps {
  onImportFiles?: () => Promise<void>;
  onImportFolder?: () => Promise<void>;
  isImporting?: boolean;
  t?: (key: string, options?: Record<string, string | number>) => string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onImportFiles,
  onImportFolder,
  isImporting
}) => {
  const { t } = useLanguage();

  return (
    <div className="empty-state-container">
      <div className="empty-state-content">
        <div className="icon-wrapper">
          <UploadCloud size={48} />
        </div>
        <h3>{t('playlist.emptyStateTitle')}</h3>
        <p className="subtitle">{t('playlist.emptyStateSubtitle')}</p>

        <div className="action-buttons">
          {isImporting ? (
            <button type="button" className="import-btn primary merged-loading" disabled style={{ width: '100%', justifyContent: 'center' }}>
              <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
              {t('playlist.processingData')}
            </button>
          ) : (
            <>
              <button type="button" className="import-btn primary" onClick={onImportFiles}>
                <FileMusic size={18} />
                {t('playlist.importFiles')}
              </button>
              <button type="button" className="import-btn secondary" onClick={onImportFolder}>
                <Folder size={18} />
                {t('playlist.importFolder')}
              </button>
            </>
          )}
        </div>

        <div className="microcopy-tip">
          {t('playlist.emptyStateTip')}
        </div>
      </div>
    </div>
  );
};
