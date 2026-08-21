import React, { useState } from 'react';
import { 
    Video, 
    LogOut, 
    LogIn, 
    Loader2, 
    ExternalLink, 
    CheckCircle, 
    FileUp, 
    Info, 
    HelpCircle, 
    ChevronDown, 
    ChevronUp 
} from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type YoutubeAuthProps } from '../types';

const COOKIES_EXTENSION_URL = 'https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc';

export const YoutubeAuth: React.FC<YoutubeAuthProps> = ({
    isVisible,
    isLoggedIn,
    isExtractingCookies,
    showLoginConfirmDialog,
    onLogin,
    onConfirmLogin,
    onCancelLoginDialog,
    onImportCookies,
    onLogout,
    t
}) => {
    const [showGuide, setShowGuide] = useState(false);

    if (!isVisible) return null;

    return (
        <>
            <div className={`setting-item youtube-auth-item ${showGuide ? 'vertical' : ''}`}>
                <div className="youtube-auth-main">
                    <div className="setting-info">
                        <div className="title-with-icon">
                            <Video size={ICON_SIZES.SMALL} color="#FF0000" />
                            <h3>{t('settings.youtube.title')}</h3>
                            <span className={`status-badge ${isLoggedIn ? 'linked' : 'not-linked'}`}>
                                {isLoggedIn ? t('settings.youtube.statusLinked') : t('settings.youtube.statusNotLinked')}
                            </span>
                        </div>
                        <p>{isLoggedIn ? t('settings.youtube.loggedInDesc') : t('settings.youtube.loggedOutDesc')}</p>
                        
                        {!isLoggedIn && (
                            <button 
                                type="button" 
                                className="guide-toggle-btn"
                                onClick={() => setShowGuide(prev => !prev)}
                            >
                                <HelpCircle size={13} />
                                <span>{showGuide ? t('settings.youtube.hideGuide') : t('settings.youtube.toggleGuide')}</span>
                                {showGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                        )}
                    </div>

                    <div className="setting-control" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isLoggedIn ? (
                            <button type="button" className="secondary-btn logout-btn" onClick={onLogout}>
                                <LogOut size={ICON_SIZES.TINY} />
                                <span>{t('settings.youtube.logout')}</span>
                            </button>
                        ) : isExtractingCookies ? (
                            <button type="button" className="primary-btn login-btn" disabled>
                                <Loader2 size={ICON_SIZES.TINY} className="spin-icon" />
                                <span>{t('settings.youtube.extracting')}</span>
                            </button>
                        ) : (
                            <>
                                <button 
                                    type="button" 
                                    className="secondary-btn" 
                                    onClick={onImportCookies}
                                    title={t('settings.youtube.importCookies')}
                                >
                                    <FileUp size={ICON_SIZES.TINY} />
                                    <span>{t('settings.youtube.importCookies')}</span>
                                </button>
                                <button type="button" className="primary-btn login-btn" onClick={onLogin}>
                                    <LogIn size={ICON_SIZES.TINY} />
                                    <span>{t('settings.youtube.login')}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Hướng dẫn chi tiết 2 cách liên kết cho end-user */}
                {!isLoggedIn && showGuide && (
                    <div className="youtube-auth-guide">
                        <div className="guide-methods">
                            {/* Cách 1: Import Cookies File */}
                            <div className="guide-method-card recommended">
                                <div>
                                    <div className="method-title">
                                        <FileUp size={15} color="var(--color-primary)" />
                                        <span>{t('settings.youtube.guideMethod1Title')}</span>
                                    </div>
                                    <ol>
                                        <li>
                                            <span>{t('settings.youtube.guideMethod1Step1Prefix')}</span>
                                            <a 
                                                href={COOKIES_EXTENSION_URL} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="external-guide-link"
                                                title="Get cookies.txt LOCALLY - Chrome Web Store"
                                            >
                                                <span>Get cookies.txt LOCALLY</span>
                                                <ExternalLink size={11} />
                                            </a>
                                            <span>{t('settings.youtube.guideMethod1Step1Suffix')}</span>
                                        </li>
                                        <li>{t('settings.youtube.guideMethod1Step2')}</li>
                                        <li>{t('settings.youtube.guideMethod1Step3')}</li>
                                        <li>{t('settings.youtube.guideMethod1Step4')}</li>
                                    </ol>
                                </div>
                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button 
                                        type="button" 
                                        className="primary-btn" 
                                        style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '500px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                        onClick={onImportCookies}
                                    >
                                        <FileUp size={12} />
                                        <span>{t('settings.youtube.importCookies')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Cách 2: Trích xuất tự động qua Firefox */}
                            <div className="guide-method-card">
                                <div>
                                    <div className="method-title">
                                        <LogIn size={15} color="var(--color-text-dim)" />
                                        <span>{t('settings.youtube.guideMethod2Title')}</span>
                                    </div>
                                    <ol>
                                        <li>{t('settings.youtube.guideMethod2Step1')}</li>
                                        <li>{t('settings.youtube.guideMethod2Step2')}</li>
                                    </ol>
                                </div>
                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button 
                                        type="button" 
                                        className="secondary-btn" 
                                        style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '500px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                        onClick={onLogin}
                                    >
                                        <LogIn size={12} />
                                        <span>{t('settings.youtube.login')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal xác nhận đăng nhập */}
            {showLoginConfirmDialog && (
                <div className="youtube-auth-confirm-overlay">
                    <div className="youtube-auth-confirm-dialog">

                        <div className="dialog-header">
                            <ExternalLink size={20} color="#FF0000" />
                            <h4>{t('settings.youtube.confirmTitle')}</h4>
                        </div>

                        <div className="dialog-body">
                            <ol className="confirm-steps">
                                <li>
                                    <span className="step-number">1</span>
                                    <span>{t('settings.youtube.confirmStep1')}</span>
                                </li>
                                <li>
                                    <span className="step-number">2</span>
                                    <span>{t('settings.youtube.confirmStep2')}</span>
                                </li>
                                <li>
                                    <span className="step-number">3</span>
                                    <span>{t('settings.youtube.confirmStep3')}</span>
                                </li>
                            </ol>

                            <div className="dialog-notice">
                                <Info size={16} />
                                <p>
                                    <span>{t('settings.youtube.chromeNoticePrefix')}</span>
                                    <a 
                                        href={COOKIES_EXTENSION_URL} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="external-guide-link"
                                        title="Get cookies.txt LOCALLY - Chrome Web Store"
                                    >
                                        <span>Get cookies.txt LOCALLY</span>
                                        <ExternalLink size={10} />
                                    </a>
                                    <span>{t('settings.youtube.chromeNoticeSuffix')}</span>
                                </p>
                            </div>
                        </div>

                        <div className="dialog-footer">
                            <button type="button" className="secondary-btn" onClick={onCancelLoginDialog}>
                                {t('settings.youtube.confirmCancel')}
                            </button>
                            <button type="button" className="secondary-btn" onClick={onImportCookies}>
                                <FileUp size={14} />
                                <span>{t('settings.youtube.importCookies')}</span>
                            </button>
                            <button type="button" className="primary-btn" onClick={onConfirmLogin}>
                                <CheckCircle size={14} />
                                <span>{t('settings.youtube.confirmDone')}</span>
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};
