import React, { useState, useCallback } from 'react';
import { NotificationContext, type AppNotification, type NotificationType  } from '@hooks';
import { NotificationItem } from './Notification';
import './Notification.scss';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const showNotification = useCallback((type: NotificationType, message: string, options: Partial<AppNotification> = {}) => {
    const id = options.id || Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => {
      // If notification with same ID exists, replace it (update)
      const exists = prev.find(n => n.id === id);
      if (exists) {
        return prev.map(n => n.id === id ? { ...n, type, message, ...options } : n);
      }
      return [...prev, { id, type, message, ...options }];
    });
    return id;
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<AppNotification>) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, updateNotification, removeNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            {...notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
