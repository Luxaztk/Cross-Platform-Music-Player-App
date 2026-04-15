import React from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@hooks';

interface SettingsSearchProps {
    query: string;
    onQueryChange: (query: string) => void;
}

export const SettingsSearch: React.FC<SettingsSearchProps> = ({ query, onQueryChange }) => {
    const { t } = useLanguage();

    return (
        <div className="settings-search">
            <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder={t('settings.searchPlaceholder')}
                />
                {query && (
                    <button className="clear-btn" onClick={() => onQueryChange('')} title={t('common.clear')}>
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};
