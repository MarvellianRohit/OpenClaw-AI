"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from './Toast';
import { AnimatePresence } from 'framer-motion';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    persistent?: boolean;
    actionLabel?: string;
    onAction?: () => void;
}

interface NotificationContextType {
    addNotification: (notification: Omit<Notification, 'id'> & { id?: string }) => string;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((n: Omit<Notification, 'id'> & { id?: string }) => {
        const id = n.id || Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => {
            // Remove existing notification with same ID if it exists
            const filtered = prev.filter(item => item.id !== id);
            return [...filtered, { ...n, id }];
        });

        if (!n.persistent) {
            setTimeout(() => {
                removeNotification(id);
            }, 5000);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification, removeNotification }}>
            {children}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
                <AnimatePresence>
                    {notifications.map((n) => (
                        <Toast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
