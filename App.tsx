import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import KokoSend from './pages/KokoSend';
import { storage } from './services/history';

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
    <>
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
    </>
  );
}