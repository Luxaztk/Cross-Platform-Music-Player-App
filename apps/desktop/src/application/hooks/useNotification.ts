import { createContext, useContext } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // 0 for persistent
  onClick?: () => void;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, options?: Partial<AppNotification>) => string;
  updateNotification: (id: string, updates: Partial<AppNotification>) => void;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
