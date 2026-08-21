import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage, useSettings, useDownload } from '@hooks';
import { ICON_SIZES } from '@constants';
import { SettingsSearch } from './components/SettingsSearch';
import { GeneralSection, AppearanceSection, DownloadSection, AudioSection } from './sections';
import { Save, Check, Settings, Palette, Download, Volume2, Info } from 'lucide-react';
import './SettingsPage.scss';

export const SettingsPage: React.FC = () => {
    const { t } = useLanguage();
    const { isSaving } = useSettings();
    const manager = useDownload();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');

    // Cleanup abandoned download state when user leaves settings
    useEffect(() => {
        return () => {
            manager.clearAbandoned();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeTab = searchParams.get('tab') || 'general';

    const menuItems = useMemo(() => [
        { id: 'general', label: t('settings.menu.general'), icon: <Settings size={ICON_SIZES.SMALL} /> },
        { id: 'appearance', label: t('settings.menu.appearance'), icon: <Palette size={ICON_SIZES.SMALL} /> },
        { id: 'audio', label: t('settings.menu.audio'), icon: <Volume2 size={ICON_SIZES.SMALL} /> },
        { id: 'downloads', label: t('settings.menu.downloads'), icon: <Download size={ICON_SIZES.SMALL} /> },
        { id: 'about', label: t('settings.menu.about'), icon: <Info size={ICON_SIZES.SMALL} /> },
    ], [t]);

    const setActiveTab = (id: string) => {
        setSearchParams({ tab: id });
    };

    const renderSection = () => {
        if (searchQuery) {
            return (
                <div className="search-results-view">
                    <GeneralSection searchQuery={searchQuery} />
                    <AppearanceSection searchQuery={searchQuery} />
                    <AudioSection searchQuery={searchQuery} />
                    <DownloadSection searchQuery={searchQuery} />
                </div>
            );
        }

        switch (activeTab) {
            case 'general': return <GeneralSection />;
            case 'appearance': return <AppearanceSection />;
            case 'audio': return <AudioSection />;
            case 'downloads': return <DownloadSection />;
            case 'about':
                return (
                    <div className="settings-section about-section">
                        <div className="about-content">
                            <div className="app-branding">
                                <h1>Melovista</h1>
                                <p>Version {__APP_VERSION__} (Desktop)</p>
                                <p className="release-date">{t('settings.about.releaseDate', { date: __BUILD_DATE__ })}</p>
                            </div>

                            <p style={{ marginTop: '20px' }}>{t('settings.about.desc')}</p>
                            <div className="footer-links">
                                <a
                                    href="https://github.com/Luxaztk/Cross-Platform-Music-Player-App"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub
                                </a>
                                <span>•</span>
                                <a
                                    href="https://github.com/Luxaztk/Cross-Platform-Music-Player-App/blob/main/LICENSE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    License
                                </a>
                            </div>
                            <div className="course-info-card project-info-card">
                                <h3>{t('settings.about.projectInfo')}</h3>

                                <div className="info-grid">
                                    <div className="info-item">
                                        <div className="label">{t('settings.about.developer')}</div>
                                        <div className="value">Luxaztk</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="label">{t('settings.about.license')}</div>
                                        <div className="value">ISC License</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="label">{t('settings.about.architecture')}</div>
                                        <div className="value">Monorepo • Offline-First</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="label">{t('settings.about.platforms')}</div>
                                        <div className="value">Desktop • Mobile • Discord Bot</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default: return <GeneralSection />;
        }
    };

    return (
        <div className="settings-page">
            <header className="settings-header">
                <div className="header-top">
                    <h1>{t('settings.title')}</h1>
                    <div className="header-actions">
                        <SettingsSearch query={searchQuery} onQueryChange={setSearchQuery} />
                        <div className={`save-indicator ${isSaving ? 'active' : ''}`}>
                            {isSaving ? (
                                <div className="saving">
                                    <Save size={ICON_SIZES.TINY} className="spinning" />
                                    <span>{t('settings.saving')}</span>
                                </div>
                            ) : (
                                <div className="saved">
                                    <Check size={ICON_SIZES.TINY} />
                                    <span>{t('settings.saved')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!searchQuery && (
                    <nav className="settings-tabs">
                        <div className="tabs-list">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    className={`tab-item ${activeTab === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {activeTab === item.id && <div className="active-indicator" />}
                                </button>
                            ))}
                        </div>
                    </nav>
                )}
            </header>

            <div className="settings-container">
                <main className={`settings-content ${searchQuery ? 'searching' : ''}`}>
                    {renderSection()}
                </main>
            </div>
        </div>
    );
};