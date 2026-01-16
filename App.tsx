import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Settings, 
  Paperclip, 
  X, 
  Moon, 
  Sun,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { sendToDiscord, sendToTelegram } from './services/integrations';
import { AppConfig, SendingStatus, Attachment } from './types';
import { DEFAULT_CONFIG } from './presets';

export default function App() {
  // --- State ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('koko-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('koko-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [platforms, setPlatforms] = useState<{ discord: boolean; telegram: boolean }>({
    discord: true,
    telegram: false,
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<SendingStatus | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('koko-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('koko-theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('koko-config', JSON.stringify(config));
  }, [config]);

  // --- Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: Attachment[] = (Array.from(e.target.files) as File[]).map(file => ({
        file,
        id: crypto.randomUUID(),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const togglePlatform = (platform: 'discord' | 'telegram') => {
    setPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handleClear = () => {
    setMessage('');
    setAttachments([]);
    setStatus(null);
  };

  const handleSend = useCallback(async () => {
    if (isSending) return;
    if (!message.trim() && attachments.length === 0) return;
    if (!platforms.discord && !platforms.telegram) return;

    setIsSending(true);
    setStatus(null);

    const results: SendingStatus = {
      discord: platforms.discord ? 'pending' : 'skipped',
      telegram: platforms.telegram ? 'pending' : 'skipped'
    };

    try {
      // Parallel execution for selected platforms
      const promises = [];

      if (platforms.discord) {
        if (!config.discordWebhook) {
          results.discord = 'error';
        } else {
          promises.push(
            sendToDiscord(config.discordWebhook, message, attachments)
              .then(() => { results.discord = 'success'; })
              .catch((err) => { 
                console.error(err);
                results.discord = 'error'; 
              })
          );
        }
      }

      if (platforms.telegram) {
        if (!config.telegramBotToken || !config.telegramChatId) {
          results.telegram = 'error';
        } else {
          promises.push(
            sendToTelegram(config.telegramBotToken, config.telegramChatId, message, attachments)
              .then(() => { results.telegram = 'success'; })
              .catch((err) => { 
                console.error(err);
                results.telegram = 'error'; 
              })
          );
        }
      }

      await Promise.all(promises);
      setStatus({ ...results });

      // Auto clear on full success
      const activePlatforms = Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k);
      const allSuccess = activePlatforms.every(p => results[p as keyof SendingStatus] === 'success');

      if (allSuccess) {
        setTimeout(() => {
          setMessage('');
          setAttachments([]);
          setStatus(null);
        }, 3000);
      }

    } catch (error) {
      console.error("Global send error", error);
    } finally {
      setIsSending(false);
    }
  }, [message, attachments, platforms, config, isSending]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Send: Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
      
      // Settings: Cmd/Ctrl + P
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSend]);

  // --- Render Helpers ---
  const getFileIcon = (file: File, className: string = "w-5 h-5") => {
    if (file.type.startsWith('image/')) return <ImageIcon className={className} />;
    if (file.type.startsWith('video/')) return <Film className={className} />;
    if (file.type.startsWith('audio/')) return <Music className={className} />;
    // Fallback for generic files
    return <FileText className={className} />;
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-300 overflow-hidden">
      
      {/* Header (Mobile Only) */}
      <header className="flex-none md:hidden sticky top-0 z-40 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex justify-between items-center">
        <h1 className="text-xl font-serif font-semibold tracking-tight">KokoSend</h1>
        <div className="flex gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* Sidebar / Configuration Panel */}
      <aside className="hidden md:flex w-full md:w-64 lg:w-72 h-full border-r border-zinc-200 dark:border-zinc-800 p-6 flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-serif font-bold tracking-tight">KokoSend</h1>
          <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider font-mono text-zinc-500">Destinations</p>
            
            {/* Discord Toggle */}
            <button
              onClick={() => togglePlatform('discord')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ease-out active:scale-[0.98] ${
                platforms.discord 
                  ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50 dark:hover:bg-zinc-200 shadow-md shadow-zinc-200 dark:shadow-zinc-900' 
                  : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Bot className="w-5 h-5" />
              <span className="font-medium">Discord</span>
            </button>

            {/* Telegram Toggle */}
            <button
              onClick={() => togglePlatform('telegram')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ease-out active:scale-[0.98] ${
                platforms.telegram
                  ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50 dark:hover:bg-zinc-200 shadow-md shadow-zinc-200 dark:shadow-zinc-900' 
                  : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Send className="w-5 h-5" />
              <span className="font-medium">Telegram</span>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800">
           <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
           >
             <Settings className="w-4 h-4" />
             <span className="hidden lg:inline">Configure API Keys</span>
             <span className="lg:hidden">Config</span>
             <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
               <span className="text-xs">⌘</span>P
             </kbd>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 max-w-4xl mx-auto w-full">
        
          {/* Mobile Platform Toggles */}
          <div className="flex-none flex md:hidden gap-3 mb-4">
            <button
              onClick={() => togglePlatform('discord')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ease-out active:scale-[0.98] shadow-sm ${
                platforms.discord 
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50 shadow-md shadow-zinc-200 dark:shadow-zinc-900' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Bot className="w-5 h-5" />
              <span className="font-medium">Discord</span>
            </button>

            <button
              onClick={() => togglePlatform('telegram')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ease-out active:scale-[0.98] shadow-sm ${
                platforms.telegram
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50 shadow-md shadow-zinc-200 dark:shadow-zinc-900' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Send className="w-5 h-5" />
              <span className="font-medium">Telegram</span>
            </button>
          </div>

          {/* Status Indicator */}
          {status && (
            <div className="flex-none mb-6 grid gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
              {platforms.discord && (
                <div className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${
                  status.discord === 'success' ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300' :
                  status.discord === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400' : 'bg-transparent border-transparent'
                }`}>
                   {status.discord === 'success' ? <CheckCircle2 className="w-4 h-4" /> : status.discord === 'error' ? <AlertCircle className="w-4 h-4" /> : <div className="w-4 h-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"/>}
                   Discord: <span className="capitalize font-mono">{status.discord}</span>
                </div>
              )}
              {platforms.telegram && (
                 <div className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${
                  status.telegram === 'success' ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300' :
                  status.telegram === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400' : 'bg-transparent border-transparent'
                }`}>
                   {status.telegram === 'success' ? <CheckCircle2 className="w-4 h-4" /> : status.telegram === 'error' ? <AlertCircle className="w-4 h-4" /> : <div className="w-4 h-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"/>}
                   Telegram: <span className="capitalize font-mono">{status.telegram}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
            
            {/* Text Area */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 resize-none bg-transparent p-4 md:p-6 outline-none text-base md:text-lg text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 font-mono overflow-y-auto"
              spellCheck={false}
            />

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="flex-none px-6 py-4 flex flex-wrap gap-3 max-h-[150px] overflow-y-auto">
                {attachments.map((att) => (
                  <div key={att.id} className="group relative flex items-center gap-3 pl-2 pr-10 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm">
                    {att.preview ? (
                      <div className="w-10 h-10 flex-shrink-0">
                        <img 
                          src={att.preview} 
                          alt={att.file.name} 
                          className="w-full h-full object-cover rounded-lg border border-zinc-200 dark:border-zinc-800"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500">
                        {getFileIcon(att.file, "w-5 h-5 text-zinc-400 dark:text-zinc-500")}
                      </div>
                    )}
                    
                    <div className="flex flex-col min-w-0 max-w-[140px]">
                      <span className="truncate font-medium text-zinc-900 dark:text-zinc-200">{att.file.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">{att.file.name.split('.').pop()} • {(att.file.size / 1024).toFixed(0)}KB</span>
                    </div>

                    <button 
                      onClick={() => removeAttachment(att.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex-none p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  
                  {/* Left: Tools - Stacks on top on mobile */}
                  <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4">
                      <div className="flex items-center gap-4">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors group relative"
                            title="Attach file"
                          >
                            <Paperclip className="w-5 h-5 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          </button>
                          <span className="text-xs font-mono text-zinc-400">
                            {message.length} chars
                          </span>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            multiple 
                            onChange={handleFileSelect}
                          />
                      </div>
                      
                      {/* Mobile Clear Button */}
                      {(message || attachments.length > 0) && (
                        <button
                         onClick={handleClear}
                         className="md:hidden p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                         title="Clear message"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                  </div>

                  {/* Right: Actions - Stacks below on mobile with full-width send */}
                  <div className="w-full md:w-auto flex items-center gap-3">
                     {/* Desktop Clear Button */}
                     {(message || attachments.length > 0) && (
                       <button
                        onClick={handleClear}
                        className="hidden md:block p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Clear message"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                     )}

                     <button
                      onClick={handleSend}
                      disabled={isSending || (!message && attachments.length === 0)}
                      className="w-full md:w-auto px-8 py-3 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-200 shadow-lg shadow-zinc-200 dark:shadow-zinc-900/20 group relative"
                     >
                        {isSending ? 'Sending...' : 'Send Message'}
                        <div className="hidden md:block absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <kbd className="inline-flex h-5 items-center gap-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-500 dark:text-zinc-400 shadow-sm">
                            <span className="text-xs">⌘</span>Enter
                          </kbd>
                        </div>
                     </button>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex-none mt-4 text-center">
              <p className="text-xs text-zinc-400 font-mono">
                KokoSend securely processes requests client-side.
              </p>
          </div>
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config} 
        onSave={setConfig} 
      />
    </div>
  );
}