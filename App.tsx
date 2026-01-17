import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import KokoSend from './pages/KokoSend';

export default function App() {
  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('koko-theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch (e) {
        // Fallback for environments where localStorage is blocked (SecurityError)
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('koko-theme', 'dark');
      } catch (e) {
        // Ignore storage errors
      }
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('koko-theme', 'light');
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [isDarkMode]);

  // --- Routing State ---
  // Simple manual router to avoid heavy dependencies on raw ESM environment
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

  // Basic Route Matching
  // If user lands on /koko directly, show KokoSend
  // Otherwise show Home
  
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