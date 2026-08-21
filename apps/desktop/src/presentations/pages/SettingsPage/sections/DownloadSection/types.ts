import { type DownloadItem } from '@music/types';
import { type DownloadContextType } from '@hooks/DownloadContext';
import { type SettingsContextType } from '@hooks/SettingsContext';

export interface DownloadSectionProps {
    searchQuery?: string;
}

export interface UseDownloadSectionReturn {
    settings: SettingsContextType['settings'];
    updateSettings: SettingsContextType['updateSettings'];
    manager: DownloadContextType;
    isSaving: boolean;
    t: (key: string, options?: Record<string, unknown> | string) => string;
    uiState: {
        showHistory: boolean;
        showEditMetadata: boolean;
        editingItem: DownloadItem | null;
        showBulkEdit: boolean;
        isBusy: boolean;
        isSyncing: boolean;
    };
    visibility: {
        showsPath: boolean;
        showsQuality: boolean;
        showsAutoImport: boolean;
        showsMaintenance: boolean;
        showsDownloader: boolean;
    };
    actions: {
        setShowHistory: (val: boolean) => void;
        setShowEditMetadata: (val: boolean) => void;
        setEditingItem: (item: DownloadItem | null) => void;
        setShowBulkEdit: (val: boolean) => void;
        handleSelectPath: () => Promise<void>;
        handleAddImportPath: () => Promise<void>;
        handleRemoveImportPath: (path: string) => void;
        handleFetchAndDownload: () => Promise<void>;
        handlePaste: () => Promise<void>;
        handleSyncLibrary: () => Promise<void>;
    };
}

export interface BaseSectionProps {
    isVisible: boolean;
}

export interface PathSettingsProps extends BaseSectionProps {
    settings: SettingsContextType['settings'];
    updateSettings: SettingsContextType['updateSettings'];
    isSaving: boolean;
    onSelectPath: () => Promise<void>;
    t: (key: string, options?: Record<string, unknown> | string) => string;
}

export interface AutoImportSettingsProps extends BaseSectionProps {
    paths: string[];
    onAdd: () => Promise<void>;
    onRemove: (path: string) => void;
    t: (key: string, options?: Record<string, unknown> | string) => string;
}

export interface DownloaderToolProps extends BaseSectionProps {
    manager: DownloadContextType;
    onFetch: () => Promise<void>;
    onPaste: () => Promise<void>;
    onEditItem: (item: DownloadItem) => void;
    onBulkEdit: (val: boolean) => void;
    t: (key: string, options?: Record<string, unknown> | string) => string;
}

export interface YoutubeAuthProps extends BaseSectionProps {
    isLoggedIn: boolean;
    isExtractingCookies: boolean;
    showLoginConfirmDialog: boolean;
    onLogin: () => Promise<boolean>;
    onConfirmLogin: () => Promise<void>;
    onCancelLoginDialog: () => void;
    onImportCookies: () => Promise<void>;
    onLogout: () => Promise<void>;
    t: (key: string, options?: Record<string, unknown> | string) => string;
}

export interface QualitySettingsProps extends BaseSectionProps {
    bitrate: string;
    onBitrateChange: (val: string | number) => void;
    t: (key: string, options?: Record<string, unknown> | string) => string;
}

export interface MaintenanceSettingsProps extends BaseSectionProps {
    isSyncing: boolean;
    onSync: () => Promise<void>;
    onShowHistory: (val: boolean) => void;
    t: (key: string, options?: Record<string, unknown> | string) => string;
}
