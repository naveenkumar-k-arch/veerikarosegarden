import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Safely handle dynamic chunk loading failures or external script errors globally
window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Importing a module script failed')
  ) {
    const reloadKey = 'vrg_chunk_auto_reload_ts';
    const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
    const now = Date.now();
    if (now - lastReload > 30000) {
      sessionStorage.setItem(reloadKey, String(now));
      console.warn('[Global] Stale chunk error caught. Reloading page...');
      window.location.reload();
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

