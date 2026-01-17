import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface HomeProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  navigate: (path: string) => void;
}

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
      setTimeout(() => {
        setNameIndex((prev) => (prev + 1) % names.length);
        setIsBlurry(false);
      }, 500);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-500 font-sans">
      {/* Header */}
      <header className="flex-none px-6 py-8 md:px-12 md:py-12 flex justify-between items-center z-10">
        <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tight">Koko.</h1>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-start justify-center px-6 md:px-12 max-w-4xl animate-in fade-in duration-700 slide-in-from-bottom-4 py-20">
        <div className="space-y-12">
          {/* Forced single row alignment for 'SALAM ANA [name]' */}
          <div className="text-2xl md:text-4xl text-zinc-900 dark:text-zinc-100 font-serif leading-none tracking-tight font-medium flex flex-row items-center whitespace-nowrap overflow-visible">
            <span>SALAM ANA</span>
            <span className={`inline-block mx-2 min-w-[3ch] transition-all duration-500 ease-in-out transform ${isBlurry ? 'blur-md opacity-0' : 'blur-0 opacity-100'}`}>
              {names[nameIndex]}
            </span>
            <span>.</span>
          </div>
          
          {showLaunchButton && (
            <div>
              <button 
                onClick={() => navigate('/koko')}
                className="text-lg md:text-xl font-normal text-zinc-800 dark:text-zinc-200 border-b border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-100 transition-all pb-0.5"
                aria-label="Launch KokoSend Application"
              >
                Writing
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer Area */}
      <footer className="flex-none mt-20 pb-20 px-6 md:px-12 max-w-4xl w-full animate-in fade-in duration-1000 delay-300">
        <div className="border-t border-zinc-100 dark:border-zinc-900 pt-16 space-y-10">
          
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Connect</h3>
            
            <nav className="flex flex-wrap items-center gap-2 text-base md:text-lg">
              <a 
                href="https://instagram.com/qaiik" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-800 hover:decoration-zinc-900 dark:hover:decoration-zinc-100"
              >
                @qaiik
              </a>
              <span className="text-zinc-300 dark:text-zinc-800" aria-hidden="true">·</span>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-800 hover:decoration-zinc-900 dark:hover:decoration-zinc-100"
              >
                toktok
              </a>
              <span className="text-zinc-300 dark:text-zinc-800" aria-hidden="true">·</span>
              <a 
                href="mailto:contact@kokosend.app" 
                className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-800 hover:decoration-zinc-900 dark:hover:decoration-zinc-100"
              >
                Email
              </a>
            </nav>
          </div>

          {/* Time Display */}
          <div className="pt-10">
            <div className="text-sm font-mono text-zinc-400 dark:text-zinc-600 tracking-wider">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}