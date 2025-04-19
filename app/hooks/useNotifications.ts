// File: app/hooks/useNotifications.ts
import { useState, useCallback } from 'react';
import { Notification } from '@types';

export const useNotifications = () => {
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  return {
    notification,
    setNotification,
    showNotification,
    hideNotification
  };
};