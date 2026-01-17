import React, { useState, useEffect } from 'react';
import { Sun, Moon, ArrowRight, Instagram, Mail } from 'lucide-react';

interface HomeProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  navigate: (path: string) => void;
}

// Simple TikTok Icon since Lucide might not have it in older versions
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    aria-hidden="true"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export default function Home({ isDarkMode, setIsDarkMode, navigate }: HomeProps) {
  const [time, setTime] = useState(new Date());
  
  // Rotating names state
  const names = ["7amdi", "QAIIK", "MOHAMED", "74mdi"];
  const [nameIndex, setNameIndex] = useState(0);
  const [isBlurry, setIsBlurry] = useState(false);

  // Check for secret access parameter
  const showLaunchButton = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('koko');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Name rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlurry(true);
      // Wait for blur out
      setTimeout(() => {
        setNameIndex((prev) => (prev + 1) % names.length);
        setIsBlurry(false);
      }, 500);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-500 font-sans">
      {/* Header */}
      <header className="flex-none px-6 py-6 md:px-12 md:py-8 flex justify-between items-center z-10">
        <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tight">Koko.</h1>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="max-w-md space-y-8">
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 font-serif leading-relaxed tracking-wide font-medium">
            SALAM ANA{' '}
            <span className={`inline-block transition-all duration-500 ease-in-out transform ${isBlurry ? 'blur-sm opacity-50 scale-95' : 'blur-0 opacity-100 scale-100'}`}>
              {names[nameIndex]}
            </span>.
          </p>
          
          {showLaunchButton && (
            <button 
              onClick={() => navigate('/koko')}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-zinc-200 dark:shadow-zinc-900/50 focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 outline-none"
              aria-label="Launch KokoSend Application"
            >
              Launch KokoSend
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </main>

      {/* Footer Area */}
      <footer className="flex-none flex flex-col items-center gap-8 pb-10 px-6 animate-in fade-in duration-1000 delay-200">
        
        {/* Links */}
        <div className="flex items-center gap-8">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors" aria-label="Visit Instagram">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors" aria-label="Visit TikTok">
            <TikTokIcon className="w-5 h-5" />
          </a>
          <a href="mailto:contact@kokosend.app" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors" aria-label="Send Email">
            <Mail className="w-5 h-5" />
          </a>
        </div>

        {/* Time - Improved Contrast for Accessibility */}
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </footer>
    </div>
  );
}