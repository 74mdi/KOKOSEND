import React, { useState, useEffect, Suspense, lazy } from 'react';
import { storage } from './services/history';

// Lazy load pages to split the bundle and improve initial load time
const Home = lazy(() => import('./pages/Home'));
const KokoSend = lazy(() => import('./pages/KokoSend'));

// Minimalist Loading Spinner
const PageLoader = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = storage.get('koko-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      storage.set('koko-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      storage.set('koko-theme', 'light');
    }
  }, [isDarkMode]);

  // --- Routing State ---
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  return (
    <Suspense fallback={<PageLoader />}>
      {currentPath === '/koko' ? (
        <KokoSend 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          navigate={navigate} 
        />
      ) : (
        <Home 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          navigate={navigate} 
        />
      )}
    </Suspense>
  );
}