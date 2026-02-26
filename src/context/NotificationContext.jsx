import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

let nextId = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((type, message, duration = 5000) => {
    const id = ++nextId;
    setNotifications(prev => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = useCallback((msg) => showNotification('success', msg), [showNotification]);
  const error = useCallback((msg) => showNotification('error', msg, 8000), [showNotification]);
  const info = useCallback((msg) => showNotification('info', msg), [showNotification]);
  const warning = useCallback((msg) => showNotification('warning', msg, 6000), [showNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, dismissNotification, success, error, info, warning }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};
