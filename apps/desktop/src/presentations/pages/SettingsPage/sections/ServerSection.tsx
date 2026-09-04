import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSettings, useLanguage, useNotification } from '@hooks';
import { useLibraryContext } from '@music/hooks';
import { ServerClient } from '@music/core';
import type { ServerHealth } from '@music/types';
import { ICON_SIZES } from '@constants';
import {
  Radio,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Music,
  UploadCloud,
  X,
  HardDrive,
  Server,
} from 'lucide-react';
import {
  ServerUploadService,
  type UploadProgressState,
} from '@infrastructure/services/ServerUploadService';
import { type SettingsSectionProps, matchesSearch } from '../utils';

export const ServerSection: React.FC<SettingsSectionProps> = ({ searchQuery }) => {
  const { t } = useLanguage();
  const { settings, updateSettings, isSaving } = useSettings();
  const { handleAddSongs, songs } = useLibraryContext();
  const { showNotification } = useNotification();

  const serverUrlFromSettings = settings?.server?.serverUrl ?? '';
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const displayUrl = draftUrl ?? serverUrlFromSettings;

  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<ServerHealth | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Push state
  const [uploadState, setUploadState] = useState<UploadProgressState | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const abortSignalRef = useRef<{ aborted: boolean }>({ aborted: false });

  // Auto-fetch health if server URL is configured
  useEffect(() => {
    if (serverUrlFromSettings && !healthStatus) {
      ServerClient.checkHealth(serverUrlFromSettings).then((res) => {
        if (res.ok && res.health) {
          setHealthStatus(res.health);
        }
      });
    }
  }, [serverUrlFromSettings, healthStatus]);

  const localSongs = useMemo(() => {
    return (songs || []).filter(
      (s) => s.sourceType !== 'stream' && !!s.filePath && !s.filePath.startsWith('http')
    );
  }, [songs]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftUrl(e.target.value);
  };

  const handleSaveUrl = async () => {
    const cleanUrl = ServerClient.normalizeUrl(displayUrl);
    setDraftUrl(null);
    if (cleanUrl !== serverUrlFromSettings) {
      await updateSettings({
        server: {
          ...settings?.server,
          serverUrl: cleanUrl,
        },
      });
      showNotification('success', t('settings.server.saved', { defaultValue: 'Đã lưu cấu hình máy chủ' }));
      if (cleanUrl) {
        ServerClient.checkHealth(cleanUrl).then((res) => {
          if (res.ok && res.health) {
            setHealthStatus(res.health);
          }
        });
      }
    }
  };

  const handleCheckConnection = useCallback(async () => {
    const targetUrl = ServerClient.normalizeUrl(displayUrl);
    if (!targetUrl) {
      setErrorMessage(t('settings.server.invalidUrl', { defaultValue: 'Vui lòng nhập địa chỉ máy chủ hợp lệ' }));
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);
    setHealthStatus(null);

    const result = await ServerClient.checkHealth(targetUrl);
    setIsChecking(false);

    if (result.ok && result.health) {
      setHealthStatus(result.health);
      setErrorMessage(null);
      // Auto save clean URL if changed
      if (targetUrl !== serverUrlFromSettings) {
        await updateSettings({
          server: {
            ...settings?.server,
            serverUrl: targetUrl,
          },
        });
      }
    } else {
      setErrorMessage(result.error || t('settings.server.cannotConnect', { defaultValue: 'Không thể kết nối tới máy chủ' }));
      setHealthStatus(null);
    }
  }, [displayUrl, serverUrlFromSettings, settings?.server, updateSettings, t]);

  const handleSyncSongs = useCallback(async () => {
    const targetUrl = ServerClient.normalizeUrl(displayUrl);
    if (!targetUrl) {
      showNotification('error', t('settings.server.invalidUrl', { defaultValue: 'Vui lòng nhập địa chỉ máy chủ hợp lệ' }));
      return;
    }

    setIsSyncing(true);
    const result = await ServerClient.fetchSongs(targetUrl);
    setIsSyncing(false);

    if (result.ok && result.songs.length > 0) {
      try {
        const importRes = await handleAddSongs(result.songs);
        showNotification(
          'success',
          t('settings.server.syncSuccess', {
            count: importRes.count ?? result.songs.length,
            defaultValue: `Đã đồng bộ thành công ${importRes.count ?? result.songs.length} bài hát từ máy chủ!`,
          })
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showNotification('error', msg || t('settings.server.syncFail', { defaultValue: 'Lỗi nạp bài hát vào thư viện' }));
      }
    } else if (result.ok && result.songs.length === 0) {
      showNotification('info', t('settings.server.noSongs', { defaultValue: 'Máy chủ chưa có bài hát nào được quét' }));
    } else {
      showNotification('error', result.error || t('settings.server.syncFail', { defaultValue: 'Không thể tải danh sách bài hát' }));
    }
  }, [displayUrl, handleAddSongs, showNotification, t]);

  const handlePushLibrary = useCallback(async () => {
    const targetUrl = ServerClient.normalizeUrl(displayUrl);
    if (!targetUrl) {
      showNotification('error', t('settings.server.invalidUrl', { defaultValue: 'Vui lòng nhập địa chỉ máy chủ hợp lệ' }));
      return;
    }

    if (localSongs.length === 0) {
      showNotification('info', t('settings.server.noLocalSongs', { defaultValue: 'Không có bài hát cục bộ nào để tải lên' }));
      return;
    }

    setIsPushing(true);
    abortSignalRef.current = { aborted: false };

    const service = ServerUploadService.getInstance();
    const summary = await service.pushSongs(
      targetUrl,
      localSongs,
      (state) => {
        setUploadState(state);
      },
      abortSignalRef.current
    );

    setIsPushing(false);

    if (summary.cancelled) {
      showNotification('info', t('settings.server.pushCancelled', { defaultValue: 'Đã hủy quá trình đẩy nhạc lên Server.' }));
    } else if (summary.error) {
      showNotification('error', summary.error || t('settings.server.pushFail', { defaultValue: 'Quá trình đẩy nhạc gặp lỗi' }));
    } else {
      showNotification(
        'success',
        t('settings.server.pushSuccess', {
          uploaded: summary.uploadedCount,
          skipped: summary.skippedCount,
          defaultValue: `Đã hoàn tất! Đẩy thành công ${summary.uploadedCount} bài hát lên Server (Bỏ qua ${summary.skippedCount} bài đã có).`,
        })
      );
      // Re-check health to update server song count
      const refreshed = await ServerClient.checkHealth(targetUrl);
      if (refreshed.ok && refreshed.health) {
        setHealthStatus(refreshed.health);
      }
    }
  }, [displayUrl, localSongs, showNotification, t]);

  const handleCancelPush = useCallback(() => {
    abortSignalRef.current.aborted = true;
  }, []);

  const autoPushOnDownload = settings?.server?.autoPushOnDownload !== false;

  const handleToggleAutoPush = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await updateSettings({
      server: {
        ...settings?.server,
        autoPushOnDownload: e.target.checked,
      },
    });
  };

  const showsServer =
    matchesSearch(t('settings.server.title'), searchQuery) ||
    matchesSearch(t('settings.server.desc'), searchQuery) ||
    matchesSearch(t('settings.server.urlTitle'), searchQuery) ||
    matchesSearch(t('settings.server.urlDesc'), searchQuery) ||
    matchesSearch(t('settings.server.pushTitle'), searchQuery) ||
    matchesSearch(t('settings.server.syncTitle'), searchQuery) ||
    matchesSearch('server', searchQuery);

  if (searchQuery && !showsServer) return null;

  return (
    <div className="settings-section server-section">
      <div className="section-header">
        <Radio size={ICON_SIZES.MEDIUM} />
        <h2>{t('settings.server.title', { defaultValue: 'Máy Chủ Streaming (Homelab)' })}</h2>
      </div>

      <div className="settings-group">
        {/* Server URL Input */}
        <div className="setting-item server-url-item">
          <div className="setting-info">
            <h3>{t('settings.server.urlTitle', { defaultValue: 'Địa chỉ Máy Chủ' })}</h3>
            <p>
              {t('settings.server.urlDesc', {
                defaultValue: 'Nhập địa chỉ IP hoặc tên miền máy chủ phát nhạc (ví dụ: http://192.168.1.185:4545 hoặc https://music.homelab.net)',
              })}
            </p>
          </div>
          <div className="setting-control server-control-group">
            <input
              type="text"
              className="server-url-input"
              value={displayUrl}
              onChange={handleUrlChange}
              onBlur={handleSaveUrl}
              placeholder="http://192.168.1.185:4545"
            />
            <button
              type="button"
              className="server-test-btn"
              onClick={handleCheckConnection}
              disabled={isChecking || isSaving}
            >
              <Wifi size={ICON_SIZES.SMALL} className={isChecking ? 'spin-icon' : ''} />
              <span>
                {isChecking
                  ? t('settings.server.checking', { defaultValue: 'Đang kiểm tra...' })
                  : t('settings.server.testBtn', { defaultValue: 'Kiểm tra kết nối' })}
              </span>
            </button>
          </div>
        </div>

        {/* Health status banner */}
        {healthStatus && (
          <div className="server-status-banner">
            <div className="banner-left">
              <CheckCircle2 size={20} className="status-icon success" />
              <div className="banner-text">
                <div className="status-title">
                  {t('settings.server.connected', { defaultValue: 'Đã kết nối thành công tới máy chủ' })}
                </div>
                <div className="status-subtitle">
                  {t('settings.server.serverInfo', {
                    service: healthStatus.service,
                    version: healthStatus.version,
                    totalSongs: healthStatus.totalSongs,
                    uptime: healthStatus.uptime,
                    defaultValue: `Dịch vụ: ${healthStatus.service} v${healthStatus.version} • Kho nhạc: ${healthStatus.totalSongs} bài hát • Uptime: ${healthStatus.uptime}s`,
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="server-sync-btn"
              onClick={handleSyncSongs}
              disabled={isSyncing || isPushing}
            >
              <RefreshCw size={ICON_SIZES.SMALL} className={isSyncing ? 'spin-icon' : ''} />
              <span>
                {isSyncing
                  ? t('settings.server.syncing', { defaultValue: 'Đang đồng bộ...' })
                  : t('settings.server.syncBtn', { defaultValue: 'Đồng bộ nhạc từ Server' })}
              </span>
            </button>
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div className="server-error-banner">
            <AlertCircle size={20} className="status-icon error" />
            <div className="error-text">{errorMessage}</div>
          </div>
        )}

        {/* 1-Click Push Library Section */}
        {(settings?.server?.serverUrl || displayUrl) && (
          <>
            <div className="setting-item server-push-item">
              <div className="setting-info">
                <h3>{t('settings.server.pushTitle', { defaultValue: 'Đẩy kho nhạc lên Server' })}</h3>
                <p>
                  {t('settings.server.pushDesc', {
                    defaultValue: 'Chuyển toàn bộ bài hát từ máy tính cá nhân lên Server Homelab với công nghệ so khớp vân tay chống trùng lặp.',
                  })}
                </p>
                <div className="server-stats-badges">
                  <span className="stat-badge local-badge">
                    <HardDrive size={13} />
                    <span>{t('settings.server.localSongsCount', { count: localSongs.length, defaultValue: `${localSongs.length} bài hát cục bộ` })}</span>
                  </span>
                  <span className="stat-badge server-badge">
                    <Server size={13} />
                    <span>
                      {healthStatus
                        ? t('settings.server.serverSongsCount', { count: healthStatus.totalSongs, defaultValue: `${healthStatus.totalSongs} bài hát trên Server` })
                        : 'Máy chủ: Chưa kết nối'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="setting-control">
                <button
                  type="button"
                  className="server-test-btn server-push-btn"
                  onClick={handlePushLibrary}
                  disabled={isPushing || isSyncing || localSongs.length === 0}
                >
                  <UploadCloud size={ICON_SIZES.SMALL} className={isPushing ? 'spin-icon' : ''} />
                  <span>
                    {isPushing
                      ? t('settings.server.pushing', { defaultValue: 'Đang đẩy lên server...' })
                      : t('settings.server.pushBtn', { defaultValue: 'Đẩy kho nhạc lên Server' })}
                  </span>
                </button>
              </div>
            </div>

            {/* Upload Progress Monitor */}
            {uploadState && (isPushing || uploadState.status !== 'idle') && (
              <div className="server-progress-box">
                <div className="progress-header">
                  <div className="progress-status-info">
                    <span className={`status-pill ${uploadState.status}`}>
                      {uploadState.status === 'diffing' && 'So khớp vân tay...'}
                      {uploadState.status === 'uploading' && `Đang đẩy: ${uploadState.current}/${uploadState.total}`}
                      {uploadState.status === 'completed' && 'Hoàn tất'}
                      {uploadState.status === 'cancelled' && 'Đã hủy'}
                      {uploadState.status === 'error' && 'Lỗi'}
                    </span>
                    <span className="current-song-name" title={uploadState.currentSongTitle}>
                      {uploadState.currentSongTitle}
                    </span>
                  </div>
                  {isPushing && (
                    <button
                      type="button"
                      className="server-cancel-btn"
                      onClick={handleCancelPush}
                    >
                      <X size={14} />
                      <span>{t('common.cancel', { defaultValue: 'Hủy' })}</span>
                    </button>
                  )}
                </div>

                <div className="progress-bar-track">
                  <div
                    className={`progress-bar-fill ${uploadState.status}`}
                    style={{ width: `${Math.min(100, Math.max(0, uploadState.percent))}%` }}
                  />
                </div>

                <div className="progress-footer">
                  <span className="percent-text">{uploadState.percent}%</span>
                  <div className="speed-and-counts">
                    {uploadState.speedMb > 0 && isPushing && (
                      <span className="speed-badge">{uploadState.speedMb} MB/s</span>
                    )}
                    <span className="summary-counts">
                      {uploadState.uploadedCount > 0 && `Đã tải: ${uploadState.uploadedCount}`}
                      {uploadState.skippedCount > 0 && ` • Bỏ qua: ${uploadState.skippedCount}`}
                      {uploadState.failedCount > 0 && ` • Lỗi: ${uploadState.failedCount}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Sync Action if healthStatus isn't showing the banner button */}
            {!healthStatus && (
              <div className="setting-item">
                <div className="setting-info">
                  <h3>{t('settings.server.syncTitle', { defaultValue: 'Đồng bộ bài hát từ Server' })}</h3>
                  <p>
                    {t('settings.server.syncDesc', {
                      defaultValue: 'Tải danh mục toàn bộ bài hát từ máy chủ vào Thư viện MeloVista',
                    })}
                  </p>
                </div>
                <div className="setting-control">
                  <button
                    type="button"
                    className="server-test-btn"
                    onClick={handleSyncSongs}
                    disabled={isSyncing || isPushing}
                  >
                    <Music size={ICON_SIZES.SMALL} />
                    <span>
                      {isSyncing
                        ? t('settings.server.syncing', { defaultValue: 'Đang đồng bộ...' })
                        : t('settings.server.syncBtn', { defaultValue: 'Đồng bộ nhạc' })}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Auto Push on YouTube Download */}
            <div className="setting-item">
              <div className="setting-info">
                <h3>{t('settings.server.autoPushTitle', { defaultValue: 'Tự động đẩy khi tải nhạc mới' })}</h3>
                <p>
                  {t('settings.server.autoPushDesc', {
                    defaultValue: 'Tự động gửi 1 bản copy lên Server Homelab mỗi khi tải thành công bài hát mới từ YouTube.',
                  })}
                </p>
              </div>
              <div className="setting-control">
                <label
                  className="server-toggle-switch"
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '44px',
                    height: '22px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoPushOnDownload}
                    onChange={handleToggleAutoPush}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    className="slider"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: autoPushOnDownload ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                      transition: '.3s',
                      borderRadius: '22px',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: '2px',
                        bottom: '2px',
                        backgroundColor: '#ffffff',
                        transition: '.3s',
                        borderRadius: '50%',
                        transform: autoPushOnDownload ? 'translateX(22px)' : 'translateX(0)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    />
                  </span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
