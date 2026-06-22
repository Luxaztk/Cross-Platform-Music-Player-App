import React from 'react';
import { Loader2 } from 'lucide-react';
import { ICON_SIZES } from '@constants';

interface LoadingStateProps {
  t: (key: string, options?: Record<string, unknown> | string) => string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ t }) => {
  return (
    <div className="downloader-loading-state">
      <Loader2 size={ICON_SIZES.XXLARGE * 1.5} className="spinning-icon" />
      <p>{t('downloader.searching')}</p>
    </div>
  );
};
