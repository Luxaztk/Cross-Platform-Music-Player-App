import React, { useEffect, useState, useCallback } from 'react';
import type { SyncHistoryEntry } from '@music/types';
import { useLibrary } from '@music/hooks';
import { useLanguage } from '@hooks'
import './SyncHistoryModal.scss';
import { X, History, Trash2, Clock, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { ICON_SIZES } from '@constants';

interface SyncHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncHistoryModal: React.FC<SyncHistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { getSyncHistory, clearSyncHistory, isSyncing } = useLibrary();
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    // Nếu đang đồng bộ ngầm, không nên fetch lịch sử để tránh kết quả không nhất quán
    if (isSyncing) return;

    setIsLoading(true);
    try {
      const data = await getSyncHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch sync history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getSyncHistory, isSyncing]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const handleClear = async () => {
    if (window.confirm(t('libraryCleanup.clearHistoryConfirm'))) {
      await clearSyncHistory();
      setHistory([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cleanup-modal-overlay" onClick={onClose}>
      <div className="cleanup-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-with-icon">
            <History size={ICON_SIZES.LARGE} className="info-icon" />
            <h2>{t('libraryCleanup.historyTitle') || 'Lịch sử đồng bộ'}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} title={t('common.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {isLoading ? (
            <div className="status-container">
              <RefreshCw className="spinning-icon" size={32} />
              <p>{t('common.loading')}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="status-container empty">
              <Clock size={48} opacity={0.3} />
              <p>{t('libraryCleanup.noHistory')}</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map(entry => (
                <div key={entry.id} className="history-item">
                  <div className="item-header">
                    <div className="timestamp-wrapper">
                      <Clock size={14} />
                      <span className="timestamp">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="stats-badges">
                      {entry.stats.added > 0 && <span className="badge added">+{entry.stats.added}</span>}
                      {entry.stats.migrated > 0 && <span className="badge migrated">~{entry.stats.migrated}</span>}
                      {entry.stats.deleted > 0 && <span className="badge deleted">-{entry.stats.deleted}</span>}
                    </div>
                  </div>
                  <div className="item-details">
                    {entry.details.map((detail, idx) => {
                      const isAdded = detail.includes('[Added]');
                      const isMigrated = detail.includes('[Migrated]');
                      const isDeleted = detail.includes('[Deleted]');
                      const isError = detail.includes('[Error]');

                      return (
                        <div key={idx} className="detail-line">
                          {isAdded && <CheckCircle2 size={12} className="icon-added" />}
                          {isMigrated && <RefreshCw size={12} className="icon-migrated" />}
                          {isDeleted && <Trash2 size={12} className="icon-deleted" />}
                          {isError && <AlertCircle size={12} className="icon-error" />}
                          <span>{detail}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <button
              type="button"
              className="text-btn danger-text"
              onClick={handleClear}
              disabled={history.length === 0 || isLoading}
            >
              <Trash2 size={16} />
              <span>{t('libraryCleanup.clearHistory')}</span>
            </button>
          </div>
          <div className="footer-right">
            <button type="button" className="primary-btn" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
