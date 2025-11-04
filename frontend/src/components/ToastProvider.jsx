import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ToastContext } from './ToastContext.js';

// Toast shape
// { id, title, message, variant, timeout, actions: [{label,onClick,variant}] }
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = ++idRef.current;
    const timeout = toast.timeout ?? 0; // default: persistent until user action
    const newToast = { id, variant: 'info', ...toast };
    setToasts((prev) => [newToast, ...prev]);

    if (timeout > 0) {
      setTimeout(() => removeToast(id), timeout);
    }
    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast stack - top center */}
      <div className="fixed z-[3000] top-4 left-1/2 -translate-x-1/2 w-[92vw] max-w-[520px] space-y-2">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const variantStyles = {
  info: 'from-blue-50 to-blue-100 border-blue-200',
  success: 'from-emerald-50 to-emerald-100 border-emerald-200',
  warning: 'from-amber-50 to-amber-100 border-amber-200',
  error: 'from-rose-50 to-rose-100 border-rose-200',
};

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  ghost: 'bg-white/0 hover:bg-white/40 text-blue-800',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
};

const Toast = ({ toast, onClose }) => {
  const { title, message, variant = 'info', actions = [] } = toast;
  return (
    <div className={`rounded-xl border shadow-lg p-3 sm:p-4 backdrop-blur bg-gradient-to-br ${variantStyles[variant] || variantStyles.info}`}
         role="alert" aria-live="assertive">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title && <div className="text-sm sm:text-base font-semibold text-blue-900">{title}</div>}
          {message && <div className="text-xs sm:text-sm text-blue-900/90 mt-0.5">{message}</div>}
        </div>
        <button
          className="text-blue-900/60 hover:text-blue-900 text-sm p-1 rounded"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {actions.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {actions.map((a, idx) => (
            <button key={idx}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition ${buttonVariants[a.variant || 'primary']}`}
              onClick={async () => {
                try {
                  await a.onClick?.();
                } finally {
                  if (a.autoClose !== false) onClose();
                }
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToastProvider;
