import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Notification.scss';
import type { NotificationType } from '@hooks';
import { ICON_SIZES } from '@constants';

interface NotificationProps {
  id: string;
  type: NotificationType;
  message: string;
  onClose: (id: string) => void;
}

const DEFAULT_DURATION = 5000; // thời gian hiển thị thông báo
const DISMISS_DELAY = 500; // 0.5s nếu đã quá thời hạn

export const NotificationItem: React.FC<NotificationProps> = ({ id, type, message, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!isHovered) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = DEFAULT_DURATION - elapsed;
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
  }, [id, isHovered, onClose]);

  return (
    <div
      className={`notification-item ${type}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="notification-icon">
        {type === 'success' && <CheckCircle size={ICON_SIZES.SMALL} />}
        {type === 'error' && <AlertCircle size={ICON_SIZES.SMALL} />}
        {type === 'info' && <Info size={ICON_SIZES.SMALL} />}
      </div>
      <div className="notification-message">{message}</div>
      <div className="notification-close" onClick={() => onClose(id)}>
        <X size={16} style={{ pointerEvents: 'none' }} />
      </div>
    </div>
  );
};
