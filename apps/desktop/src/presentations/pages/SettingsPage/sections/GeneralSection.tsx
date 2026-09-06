import React from 'react';
import { useSettings, useLanguage } from '@hooks';
import { ICON_SIZES } from '@constants';
import { RotateCcw, Languages } from 'lucide-react';
import { CustomDropdown } from '@components';
import { LANGUAGE_OPTIONS, type GeneralSectionProps, matchesSearch } from '../utils';
import type { Language } from '@music/i18n';

export const GeneralSection: React.FC<GeneralSectionProps> = ({ searchQuery }) => {
  const { t, setLanguage } = useLanguage();
  const { settings, updateSettings, resetSettings, isSaving } = useSettings();
  
  const [isChecking, setIsChecking] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState<string | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = React.useState(false);

  // Local state for DidYouKnow tips
  const [showTips, setShowTips] = React.useState(() => {
    return localStorage.getItem('hide_did_you_know') !== 'true';
  });

  const handleToggleTips = (checked: boolean) => {
    setShowTips(checked);
    if (checked) {
      localStorage.removeItem('hide_did_you_know');
      // Dispatch a custom event so DidYouKnow can listen to it without a full app reload
      window.dispatchEvent(new Event('did_you_know_changed'));
    } else {
      localStorage.setItem('hide_did_you_know', 'true');
      window.dispatchEvent(new Event('did_you_know_changed'));
    }
  };

  React.useEffect(() => {
    const handleStorageChange = () => {
      setShowTips(localStorage.getItem('hide_did_you_know') !== 'true');
    };
    
    window.addEventListener('did_you_know_changed', handleStorageChange);
    return () => {
      window.removeEventListener('did_you_know_changed', handleStorageChange);
    };
  }, []);

  React.useEffect(() => {
    const unbindAvailable = window.electronAPI.onUpdateAvailable((version: string) => {
      setIsChecking(false);
      setUpdateStatus(`${t('settings.general.updateAvailable')}: ${version}`);
    });
    
    const unbindNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      setIsChecking(false);
      setUpdateStatus(t('settings.general.upToDate'));
    });
    
    const unbindError = window.electronAPI.onUpdateError((err: string) => {
      setIsChecking(false);
      setUpdateStatus(`${t('common.error')}: ${err}`);
    });

    const unbindDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      setIsChecking(false);
      setUpdateDownloaded(true);
      setUpdateStatus(t('update.ready'));
    });
    
    return () => {
      unbindAvailable();
      unbindNotAvailable();
      unbindError();
      unbindDownloaded();
    };
  }, [t]);

  const handleReset = () => {
    if (window.confirm(t('settings.general.resetConfirm'))) {
      resetSettings();
    }
  };

  const handleCheckUpdates = async () => {
    if (updateDownloaded) {
      window.electronAPI.restartApp();
      return;
    }
    
    setIsChecking(true);
    setUpdateStatus(t('settings.general.checkingUpdates'));
    try {
      await window.electronAPI.checkForUpdatesManual();
    } catch {
      setIsChecking(false);
      setUpdateStatus(t('common.error'));
    }
  };

  const showsLanguage =
    matchesSearch(t('settings.general.language'), searchQuery) || 
    matchesSearch(t('settings.general.languageDesc'), searchQuery);
    
  const showsAutoUpdate = 
    matchesSearch(t('settings.general.autoUpdate'), searchQuery) || 
    matchesSearch(t('settings.general.autoUpdateDesc'), searchQuery);
    
  const showsReset = 
    matchesSearch(t('settings.general.reset'), searchQuery) || 
    matchesSearch(t('settings.general.resetDesc'), searchQuery);
    
  const showsTipsToggle = 
    matchesSearch(t('settings.general.showTips'), searchQuery) || 
    matchesSearch(t('settings.general.showTipsDesc'), searchQuery);

  if (searchQuery && !showsLanguage && !showsAutoUpdate && !showsReset && !showsTipsToggle) return null;

  return (
    <div className="settings-section">
      <div className="section-header">
        <Languages size={ICON_SIZES.MEDIUM} />
        <h2>{t('settings.general.title')}</h2>
      </div>

      <div className="settings-group">
        {showsLanguage && (
          <div className="setting-item">
            <div className="setting-info">
              <h3>{t('settings.general.language')}</h3>
              <p>{t('settings.general.languageDesc')}</p>
            </div>
            <div className="setting-control">
              <CustomDropdown
                value={settings.general.language}
                onChange={(val) => {
                  setLanguage(val as Language);
                  updateSettings({ general: { language: val } });
                }}
                options={LANGUAGE_OPTIONS}
                title={t('settings.general.languageSelect')}
              />
            </div>
          </div>
        )}

        {showsAutoUpdate && (
          <div className="setting-item">
            <div className="setting-info">
              <h3>{t('settings.general.autoUpdate')}</h3>
              <p>{t('settings.general.autoUpdateDesc')}</p>
              {updateStatus && (
                <p className="update-status" style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                  {updateStatus}
                </p>
              )}
            </div>
            <div className="setting-control" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Custom Toggle Switch */}
              <label 
                className={`switch-container ${updateDownloaded ? 'disabled' : ''}`}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '44px',
                  height: '22px',
                  opacity: updateDownloaded ? 0.5 : 1,
                  cursor: updateDownloaded ? 'not-allowed' : 'pointer'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={settings.general.autoUpdate} 
                  disabled={updateDownloaded}
                  onChange={(e) => updateSettings({ general: { autoUpdate: e.target.checked } })}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span 
                  className="slider" 
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.general.autoUpdate ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                    transition: '.3s',
                    borderRadius: '22px'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: '2px',
                    bottom: '2px',
                    backgroundColor: 'white',
                    transition: '.3s',
                    borderRadius: '50%',
                    transform: settings.general.autoUpdate ? 'translateX(22px)' : 'translateX(0)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>

              {/* Manual Check Button */}
              <button 
                type="button" 
                className={`check-updates-btn ${isChecking ? 'loading' : ''} ${updateDownloaded ? 'restart' : ''}`} 
                onClick={handleCheckUpdates} 
                disabled={isChecking}
              >
                {isChecking && (
                  <span style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid transparent',
                    borderTopColor: 'var(--color-text-main)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block'
                  }} />
                )}
                <span>
                  {updateDownloaded 
                    ? t('update.restartNow') 
                    : isChecking 
                      ? t('settings.general.checkingUpdates') 
                      : t('settings.general.checkUpdates')}
                </span>
              </button>
            </div>
          </div>
        )}

        {showsTipsToggle && (
          <div className="setting-item">
            <div className="setting-info">
              <h3>{t('settings.general.showTips')}</h3>
              <p>{t('settings.general.showTipsDesc')}</p>
            </div>
            <div className="setting-control" style={{ display: 'flex', alignItems: 'center' }}>
              <label 
                className="switch-container"
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '44px',
                  height: '22px',
                  cursor: 'pointer'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={showTips} 
                  onChange={(e) => handleToggleTips(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span 
                  className="slider" 
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: showTips ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                    transition: '.3s',
                    borderRadius: '22px'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: '2px',
                    bottom: '2px',
                    backgroundColor: 'white',
                    transition: '.3s',
                    borderRadius: '50%',
                    transform: showTips ? 'translateX(22px)' : 'translateX(0)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>
          </div>
        )}

        {showsReset && (
          <div className="setting-item danger-zone">
            <div className="setting-info">
              <h3>{t('settings.general.reset')}</h3>
              <p>{t('settings.general.resetDesc')}</p>
            </div>
            <div className="setting-control">
              <button type="button" className="reset-btn" onClick={handleReset} disabled={isSaving}>
                <RotateCcw size={ICON_SIZES.XSMALL} />
                <span>{t('settings.general.resetBtn')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Thêm CSS spin nếu chưa có trong global */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
