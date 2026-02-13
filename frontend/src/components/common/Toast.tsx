import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        addToast({ type: 'error', title, message, duration: 7000 });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string) => {
        addToast({ type: 'warning', title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        addToast({ type: 'info', title, message });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
            role="region"
            aria-label="Notifications"
        >
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

interface ToastItemProps {
    toast: Toast;
    onClose: () => void;
}

const toastStyles: Record<ToastType, { bg: string; icon: string; iconColor: string }> = {
    success: {
        bg: 'bg-green-50 border-green-200',
        icon: '✓',
        iconColor: 'text-green-500',
    },
    error: {
        bg: 'bg-red-50 border-red-200',
        icon: '✕',
        iconColor: 'text-red-500',
    },
    warning: {
        bg: 'bg-yellow-50 border-yellow-200',
        icon: '⚠',
        iconColor: 'text-yellow-500',
    },
    info: {
        bg: 'bg-blue-50 border-blue-200',
        icon: 'ℹ',
        iconColor: 'text-blue-500',
    },
};

function ToastItem({ toast, onClose }: ToastItemProps) {
    const styles = toastStyles[toast.type];

    return (
        <div
            className={`
                ${styles.bg} border rounded-lg shadow-lg p-4
                animate-slide-in flex items-start gap-3
            `}
            role="alert"
        >
            <span className={`${styles.iconColor} text-lg font-bold`}>
                {styles.icon}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                {toast.message && (
                    <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
                )}
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss notification"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
