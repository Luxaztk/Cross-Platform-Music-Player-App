import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage, useSettings } from '@hooks';
import { SettingsSearch } from './components/SettingsSearch';
import { GeneralSection, AppearanceSection, DownloadSection, AudioSection } from './sections';
import { Save, Check, Settings, Palette, Download, Volume2, Info } from 'lucide-react';
import './SettingsPage.scss';

export const SettingsPage: React.FC = () => {
    const { t } = useLanguage();
    const { isSaving } = useSettings();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');

    const activeTab = searchParams.get('tab') || 'general';

    const menuItems = useMemo(() => [
        { id: 'general', label: t('settings.menu.general'), icon: <Settings size={18} /> },
        { id: 'appearance', label: t('settings.menu.appearance'), icon: <Palette size={18} /> },
        { id: 'audio', label: t('settings.menu.audio'), icon: <Volume2 size={18} /> },
        { id: 'downloads', label: t('settings.menu.downloads'), icon: <Download size={18} /> },
        { id: 'about', label: t('settings.menu.about'), icon: <Info size={18} /> },
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
                      </div>
                      <p>{t('settings.about.desc')}</p>
                      <div className="footer-links">
                        <a
                          href="https://github.com/Luxaztk/Cross-Platform-Music-Player-App"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          GitHub
                        </a>
                        <span>•</span>
                        <a>License</a>
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
                                    <Save size={14} className="spinning" />
                                    <span>{t('settings.saving')}</span>
                                </div>
                            ) : (
                                <div className="saved">
                                    <Check size={14} />
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

export default SettingsPage;
