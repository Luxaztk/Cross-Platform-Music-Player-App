import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import './Notification.scss';
import type { AppNotification } from '@hooks';
import { ICON_SIZES } from '@constants';

interface NotificationProps extends AppNotification {
  onClose: (id: string) => void;
}

const DEFAULT_DURATION = 5000; // thời gian hiển thị thông báo
const DISMISS_DELAY = 500; // 0.5s nếu đã quá thời hạn

export const NotificationItem: React.FC<NotificationProps> = ({ id, type, message, duration, onClick, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [startTime] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (duration === 0) return; // Persistent

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!isHovered) {
      const elapsed = Date.now() - startTime;
      const targetDuration = duration || DEFAULT_DURATION;
      const remainingTime = targetDuration - elapsed;
      const delay = remainingTime > 0 ? remainingTime : DISMISS_DELAY;

      timerRef.current = setTimeout(() => {
        onClose(id);
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, isHovered, onClose, duration, startTime]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`notification-item ${type} ${onClick ? 'actionable' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="notification-icon">
        {type === 'success' && <CheckCircle size={ICON_SIZES.SMALL} />}
        {type === 'error' && <AlertCircle size={ICON_SIZES.SMALL} />}
        {type === 'info' && <Info size={ICON_SIZES.SMALL} />}
        {type === 'warning' && <AlertTriangle size={ICON_SIZES.SMALL} />}
      </div>
      <div className="notification-message">{message}</div>
      <div className="notification-close" onClick={(e) => {
        e.stopPropagation();
        onClose(id);
      }}>
        <X size={16} style={{ pointerEvents: 'none' }} />
      </div>
    </div>
  );
};
