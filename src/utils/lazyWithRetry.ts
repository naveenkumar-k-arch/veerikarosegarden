import React from 'react';

/**
 * Wraps React.lazy with automatic chunk-load retry and fallback recovery.
 * If a user's browser has cached an older version of the app and a new deploy occurred,
 * the older chunk hash might return 404. This automatically refreshes once to get the latest chunk.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const module = await componentImport();
      // Reset chunk reload marker on successful dynamic import
      sessionStorage.removeItem('vrg_chunk_reload_attempted');
      return module?.default ? module : { default: module };
    } catch (error: any) {
      console.warn('[lazyWithRetry] Module failed to load, checking if reload needed:', error);
      
      const hasReloaded = sessionStorage.getItem('vrg_chunk_reload_attempted');
      if (!hasReloaded) {
        sessionStorage.setItem('vrg_chunk_reload_attempted', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}
