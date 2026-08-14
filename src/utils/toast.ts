export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastEventDetail {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export function showToast(
  message: string,
  type: ToastType = 'success',
  title?: string,
  duration = 3000
) {
  const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const detail: ToastEventDetail = {
    id,
    type,
    title,
    message,
    duration
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vrg_show_toast', { detail }));
  }
}

export const toast = {
  success: (message: string, title?: string, duration?: number) =>
    showToast(message, 'success', title || 'Success', duration),
  error: (message: string, title?: string, duration?: number) =>
    showToast(message, 'error', title || 'Error', duration),
  info: (message: string, title?: string, duration?: number) =>
    showToast(message, 'info', title || 'Notice', duration),
  warning: (message: string, title?: string, duration?: number) =>
    showToast(message, 'warning', title || 'Warning', duration)
};
