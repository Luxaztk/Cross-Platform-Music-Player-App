import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Play, Trash2, Download, BookmarkCheck, Clock, ArrowLeftRight, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { useLanguage } from '@hooks';
import type { ChapterEditorModalProps } from './types';
import { useChapterEditor } from './useChapterEditor';
import './ChapterEditorModal.scss';

export const ChapterEditorModal: React.FC<ChapterEditorModalProps> = ({
  isOpen,
  onClose,
  song,
  currentAudioTime = 0,
  onSeek,
  onSave,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    chapters,
    isDirty,
    isSaving,
    isExporting,
    statusMessage,
    statusType,
    handleAddChapter,
    handleRemoveChapter,
    handleUpdateTitle,
    handleUpdateArtist,
    handleSwapArtistTitle,
    handleToggleSkip,
    handleAdjustTime,
    handleMarkCurrentTime,
    handlePreview,
    handleSave,
    handleExportPhysicalSlices,
    formatTime,
  } = useChapterEditor(song, currentAudioTime, onSeek, isOpen, onSave);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !song) return null;

  return ReactDOM.createPortal(
    <div className="chapter-editor-overlay" onClick={onClose}>
      <div className={`chapter-editor-modal ${isExpanded ? 'is-expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-info">
            <h2>
              <BookmarkCheck size={22} />
              {t('chapters.title') || 'Quản lý mốc bài hát (Chapters)'}
            </h2>
            <div className="song-subtitle" title={`${song.title} - ${song.artist}`}>
              {song.title} {song.artist ? `• ${song.artist}` : ''}
            </div>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="action-icon-btn expand-btn"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? (t('chapters.restore') || 'Thu nhỏ cửa sổ') : (t('chapters.maximize') || 'Mở rộng toàn màn hình')}
              aria-label={isExpanded ? (t('chapters.restore') || 'Thu nhỏ cửa sổ') : (t('chapters.maximize') || 'Mở rộng toàn màn hình')}
            >
              {isExpanded ? <Minimize2 size={ICON_SIZES.MEDIUM} /> : <Maximize2 size={ICON_SIZES.MEDIUM} />}
            </button>
            <button
              type="button"
              className="action-icon-btn close-btn"
              onClick={onClose}
              title={t('chapters.close') || 'Đóng'}
              aria-label={t('chapters.close') || 'Đóng'}
            >
              <X size={ICON_SIZES.MEDIUM} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="modal-toolbar">
          <div className="toolbar-left">
            <button
              type="button"
              className="add-btn"
              onClick={() => handleAddChapter()}
            >
              <Plus size={ICON_SIZES.SMALL} />
              {t('chapters.addChapter') || 'Thêm mốc mới'}
            </button>
            <div className="current-time-indicator">
              <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {t('player.progress') || 'Vị trí phát'}: {formatTime(currentAudioTime)}
            </div>
          </div>

          <div className="toolbar-right">
            <button
              type="button"
              className="export-btn"
              onClick={handleExportPhysicalSlices}
              disabled={isExporting || chapters.length === 0}
              title={t('chapters.exportSlices') || 'Xuất thành các file rời (.mp3)'}
            >
              <Download size={ICON_SIZES.SMALL} />
              {isExporting ? (t('chapters.saving') || 'Đang xuất...') : (t('chapters.exportSlices') || 'Xuất file rời (.mp3)')}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`modal-status-banner ${statusType || 'info'}`}>
            {statusMessage}
          </div>
        )}

        {/* Chapter List */}
        <div className="modal-body">
          {chapters.length === 0 ? (
            <div className="empty-chapters">
              <p>{t('chapters.noChapters') || 'Chưa có mốc thời gian nào cho bài hát này.'}</p>
              <button
                type="button"
                className="add-btn"
                onClick={() => handleAddChapter(0)}
              >
                <Plus size={ICON_SIZES.SMALL} />
                {t('chapters.addFirst') || 'Thêm mốc đầu tiên'}
              </button>
            </div>
          ) : (
            chapters.map((ch, idx) => (
              <div key={ch.id || idx} className={`chapter-row ${ch.skip ? 'is-skipped' : ''}`}>
                <button
                  type="button"
                  className="preview-btn"
                  onClick={() => handlePreview(ch.startTime)}
                  title={t('chapters.preview') || 'Nghe thử mốc này'}
                >
                  <Play size={14} />
                </button>

                <span className="chapter-index">
                  #{String(idx + 1).padStart(2, '0')}
                </span>

                <div className="chapter-inputs">
                  <input
                    type="text"
                    className="chapter-title-input"
                    value={ch.title}
                    onChange={(e) => handleUpdateTitle(ch.id, e.target.value)}
                    placeholder={t('chapters.chapterName') || 'Tên bài con'}
                    title={t('chapters.chapterName') || 'Tên bài con'}
                  />

                  <button
                    type="button"
                    className="swap-btn"
                    onClick={() => handleSwapArtistTitle(ch.id)}
                    title={t('chapters.swapArtistTitle') || 'Đảo Tên bài ⇄ Nghệ sĩ'}
                  >
                    <ArrowLeftRight size={13} />
                  </button>

                  <input
                    type="text"
                    className="chapter-artist-input"
                    value={ch.artist || ''}
                    onChange={(e) => handleUpdateArtist(ch.id, e.target.value)}
                    placeholder={t('chapters.artist') || 'Nghệ sĩ'}
                    title={t('chapters.artist') || 'Nghệ sĩ'}
                  />
                </div>

                <div className="chapter-time-box" title="Start - End">
                  {formatTime(ch.startTime)} {ch.endTime ? `- ${formatTime(ch.endTime)}` : ''}
                </div>

                <div className="micro-adjust-group">
                  <button
                    type="button"
                    className="adjust-btn"
                    onClick={() => handleAdjustTime(ch.id, -1)}
                    title="-1 giây"
                  >
                    -1s
                  </button>
                  <button
                    type="button"
                    className="adjust-btn"
                    onClick={() => handleAdjustTime(ch.id, -0.5)}
                    title="-0.5 giây"
                  >
                    -0.5s
                  </button>
                  <button
                    type="button"
                    className="adjust-btn"
                    onClick={() => handleAdjustTime(ch.id, 0.5)}
                    title="+0.5 giây"
                  >
                    +0.5s
                  </button>
                  <button
                    type="button"
                    className="adjust-btn"
                    onClick={() => handleAdjustTime(ch.id, 1)}
                    title="+1 giây"
                  >
                    +1s
                  </button>
                </div>

                <button
                  type="button"
                  className="pin-current-btn"
                  onClick={() => handleMarkCurrentTime(ch.id)}
                  title={t('chapters.markCurrentTime') || 'Ghim mốc tại thời điểm đang nghe'}
                >
                  📌 {t('chapters.pin') || 'Ghim'}
                </button>

                <button
                  type="button"
                  className={`skip-toggle-btn ${ch.skip ? 'active' : ''}`}
                  onClick={() => handleToggleSkip(ch.id)}
                  title={ch.skip ? (t('chapters.skippedBadge') || 'Đã bỏ qua') : (t('chapters.skipChapter') || 'Bỏ qua khi phát')}
                >
                  <VolumeX size={15} />
                </button>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleRemoveChapter(ch.id)}
                  title={t('chapters.deleteChapter') || 'Xóa mốc'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
          >
            {t('chapters.close') || 'Đóng'}
          </button>
          <button
            type="button"
            className="save-btn"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? (t('chapters.saving') || 'Đang lưu...') : (t('chapters.save') || 'Lưu thay đổi')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
