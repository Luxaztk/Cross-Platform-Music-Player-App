import React from 'react';
import { useLanguage } from '@hooks';
import { Settings, Palette, Download, Volume2, Info } from 'lucide-react';

interface SettingsSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeSection, onSectionChange }) => {
    const { t } = useLanguage();

    const menuItems = [
        { id: 'general', label: t('settings.menu.general'), icon: <Settings size={18} /> },
        { id: 'appearance', label: t('settings.menu.appearance'), icon: <Palette size={18} /> },
        { id: 'audio', label: t('settings.menu.audio'), icon: <Volume2 size={18} /> },
        { id: 'downloads', label: t('settings.menu.downloads'), icon: <Download size={18} /> },
        { id: 'about', label: t('settings.menu.about'), icon: <Info size={18} /> },
    ];

    return (
        <nav className="settings-sidebar">
            <ul className="settings-nav-list">
                {menuItems.map((item) => (
                    <li key={item.id}>
                        <button 
                            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => onSectionChange(item.id)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
