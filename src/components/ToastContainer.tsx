import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastEventDetail, ToastType } from '../utils/toast';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastEventDetail[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: any) => {
      const detail = e.detail as ToastEventDetail;
      if (!detail || !detail.message) return;

      setToasts(prev => {
        // Limit maximum concurrent toasts to 4
        const updated = [...prev.filter(t => t.id !== detail.id), detail];
        return updated.slice(-4);
      });

      const duration = detail.duration || 3000;
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== detail.id));
      }, duration);
    };

    window.addEventListener('vrg_show_toast', handleToastEvent);
    return () => window.removeEventListener('vrg_show_toast', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[92vw] sm:w-auto pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(toast => {
        const typeConfig: Record<
          ToastType,
          { bg: string; border: string; icon: React.ReactNode; iconBg: string; titleColor: string }
        > = {
          success: {
            bg: 'bg-emerald-950/95 backdrop-blur-md',
            border: 'border-emerald-500/40 shadow-xl shadow-emerald-950/40',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />,
            iconBg: 'bg-emerald-800/80',
            titleColor: 'text-emerald-300'
          },
          error: {
            bg: 'bg-rose-950/95 backdrop-blur-md',
            border: 'border-rose-500/40 shadow-xl shadow-rose-950/40',
            icon: <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />,
            iconBg: 'bg-rose-800/80',
            titleColor: 'text-rose-300'
          },
          warning: {
            bg: 'bg-amber-950/95 backdrop-blur-md',
            border: 'border-amber-500/40 shadow-xl shadow-amber-950/40',
            icon: <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />,
            iconBg: 'bg-amber-800/80',
            titleColor: 'text-amber-300'
          },
          info: {
            bg: 'bg-slate-900/95 backdrop-blur-md',
            border: 'border-cyan-500/40 shadow-xl shadow-slate-950/40',
            icon: <Info className="w-5 h-5 text-cyan-300 shrink-0" />,
            iconBg: 'bg-cyan-900/80',
            titleColor: 'text-cyan-300'
          }
        };

        const config = typeConfig[toast.type] || typeConfig.success;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border text-white transition-all transform animate-in fade-in slide-in-from-top-3 duration-250 ${config.bg} ${config.border}`}
          >
            <div className={`p-1.5 rounded-xl ${config.iconBg} flex items-center justify-center`}>
              {config.icon}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <h4 className={`text-xs font-black tracking-wide uppercase ${config.titleColor}`}>
                  {toast.title}
                </h4>
              )}
              <p className="text-xs sm:text-sm font-bold text-slate-100 leading-snug mt-0.5 break-words">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
