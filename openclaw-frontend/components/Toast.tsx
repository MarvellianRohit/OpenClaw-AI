"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, RefreshCw, Info, CheckCircle } from 'lucide-react';
import { Notification } from './NotificationContext';

interface ToastProps {
    notification: Notification;
    onClose: () => void;
}

export default function Toast({ notification, onClose }: ToastProps) {
    const { message, type, actionLabel, onAction } = notification;

    const icons = {
        error: <AlertTriangle className="text-orange-500" size={18} />,
        warning: <AlertTriangle className="text-yellow-500" size={18} />,
        info: <Info className="text-neon-cyan" size={18} />,
        success: <CheckCircle className="text-green-500" size={18} />,
    };

    const borders = {
        error: 'border-orange-500/50',
        warning: 'border-yellow-500/50',
        info: 'border-neon-cyan/50',
        success: 'border-green-500/50',
    };

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className={`pointer-events-auto min-w-[320px] max-w-md bg-obsidian/80 backdrop-blur-[10px] border-l-2 ${borders[type]} p-4 rounded-r-lg shadow-2xl flex items-start gap-4`}
        >
            <div className="mt-1 shrink-0">
                {icons[type]}
            </div>

            <div className="flex-1 flex flex-col gap-2">
                <p className="text-xs font-mono text-titanium leading-relaxed">
                    {message}
                </p>

                {onAction && (
                    <button
                        onClick={onAction}
                        className="flex items-center gap-2 text-[10px] font-bold text-neon-cyan hover:text-white transition-colors w-fit"
                    >
                        <RefreshCw size={12} />
                        {actionLabel || 'RETRY'}
                    </button>
                )}
            </div>

            <button
                onClick={onClose}
                className="shrink-0 text-titanium-dim hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}
