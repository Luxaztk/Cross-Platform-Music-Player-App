import React from 'react';
import { Search, Clipboard, ClipboardCheck } from 'lucide-react';
import { ICON_SIZES } from '@constants';

interface InputStateProps {
  url: string;
  isPasted: boolean;
  onUrlChange: (val: string) => void;
  onPaste: () => void;
  onFetch: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  t: (key: string, options?: any) => string;
}

export const InputState: React.FC<InputStateProps> = ({
  url,
  isPasted,
  onUrlChange,
  onPaste,
  onFetch,
  inputRef,
  t
}) => {
  return (
    <div className="downloader-input-state">
      <div className="input-header">
        <Search size={ICON_SIZES.XXLARGE * 1.5} className="placeholder-icon" />
        <p>{t('downloader.urlPlaceholder')}</p>
      </div>
      <div className="input-group">
        <div className="url-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            onKeyDown={(e) => e.key === 'Enter' && onFetch()}
          />
          <button
            type="button"
            className={`paste-btn ${isPasted ? 'success' : ''}`}
            onClick={onPaste}
          >
            {isPasted ? <ClipboardCheck size={ICON_SIZES.XSMALL} /> : <Clipboard size={ICON_SIZES.XSMALL} />}
          </button>
        </div>
        <button
          type="button"
          className="fetch-btn"
          onClick={onFetch}
          disabled={!url.trim()}
        >
          {t('downloader.fetchInfo')}
        </button>
      </div>
    </div>
  );
};
