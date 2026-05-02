import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ICON_SIZES } from '@constants';

interface AuthStateProps {
  t: (key: string, options?: any) => string;
}

export const AuthState: React.FC<AuthStateProps> = ({ t }) => {
  return (
    <div className="downloader-auth-state">
      <AlertCircle size={ICON_SIZES.XXLARGE * 1.5} className="warning-icon" />
      <h3>{t('downloader.authRequiredTitle')}</h3>
      <p>{t('downloader.authRequiredDesc')}</p>
    </div>
  );
};
