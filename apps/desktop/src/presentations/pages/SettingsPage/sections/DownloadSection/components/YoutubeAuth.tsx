import React from 'react';
import { Video, LogOut, LogIn } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type YoutubeAuthProps } from '../types';

export const YoutubeAuth: React.FC<YoutubeAuthProps> = ({
    isVisible,
    isLoggedIn,
    onLogin,
    onLogout,
    t
}) => {
    if (!isVisible) return null;

    return (
        <div className="setting-item youtube-auth-item">
            <div className="setting-info">
                <div className="title-with-icon">
                    <Video size={ICON_SIZES.SMALL} color="#FF0000" />
                    <h3>{t('settings.youtube.title')}</h3>
                </div>
                <p>{isLoggedIn ? t('settings.youtube.loggedInDesc') : t('settings.youtube.loggedOutDesc')}</p>
            </div>
            <div className="setting-control">
                {isLoggedIn ? (
                    <button type="button" className="secondary-btn logout-btn" onClick={onLogout}>
                        <LogOut size={ICON_SIZES.TINY} />
                        <span>{t('settings.youtube.logout')}</span>
                    </button>
                ) : (
                    <button type="button" className="primary-btn login-btn" onClick={onLogin}>
                        <LogIn size={ICON_SIZES.TINY} />
                        <span>{t('settings.youtube.login')}</span>
                    </button>
                )}
            </div>
        </div>
    );
};
