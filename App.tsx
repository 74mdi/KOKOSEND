import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
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
  Trash2,
  Clock,
  LayoutTemplate,
  Eye,
  Edit2,
  RefreshCw
} from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { sendToDiscord, sendToTelegram } from './services/integrations';
import { addToHistory } from './services/history';
import { AppConfig, SendingStatus, Attachment, DiscordEmbed } from './types';
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
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<SendingStatus | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Feature State
  const [showEmbedBuilder, setShowEmbedBuilder] = useState(false);
  const [embedConfig, setEmbedConfig] = useState<DiscordEmbed>({ title: '', description: '', color: '#5865F2' });
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
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
  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newAttachments: Attachment[] = (Array.from(files) as File[]).map(file => ({
        file,
        id: crypto.randomUUID(),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFileSelect(e.clipboardData.files);
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
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
    setEmbedConfig({ title: '', description: '', color: '#5865F2' });
  };

  const handleRetry = useCallback(async (platform: 'discord' | 'telegram') => {
    if (isSending) return;
    
    setIsSending(true);
    // Set status to pending for the retrying platform to show spinner
    setStatus(prev => prev ? ({ ...prev, [platform]: 'pending' }) : null);

    try {
      if (platform === 'discord') {
         if (!config.discordWebhook) throw new Error("Missing Discord Webhook URL");
         const embedData = showEmbedBuilder ? embedConfig : undefined;
         await sendToDiscord(config.discordWebhook, message, attachments, embedData);
      } else {
         if (!config.telegramBotToken || !config.telegramChatId) throw new Error("Missing Telegram Credentials");
         let finalMsg = message;
         // Append embed content for Telegram if it exists
         if (showEmbedBuilder && (embedConfig.title || embedConfig.description)) {
             finalMsg += `\n\n**${embedConfig.title}**\n${embedConfig.description}`;
         }
         await sendToTelegram(config.telegramBotToken, config.telegramChatId, finalMsg, attachments);
      }

      setStatus(prev => {
        if (!prev) return null;
        const newStatus = { ...prev, [platform]: 'success' };
        
        // Check if all active platforms are now successful
        const allActiveSuccess = Object.entries(newStatus).every(([k, v]) => 
           v === 'skipped' || v === 'success'
        );

        if (allActiveSuccess) {
             const successfulPlatforms = Object.entries(newStatus)
                .filter(([_, v]) => v === 'success')
                .map(([k]) => k) as ('discord' | 'telegram')[];
             
             addToHistory({
                 text: message || (showEmbedBuilder ? `[Embed] ${embedConfig.title}` : '[Attachment Only]'),
                 platforms: successfulPlatforms,
                 status: 'success'
             });

            setTimeout(() => {
                setMessage('');
                setAttachments([]);
                setStatus(null);
                setEmbedConfig({ title: '', description: '', color: '#5865F2' });
            }, 3000);
        }

        return newStatus as SendingStatus;
      });

    } catch (error) {
      console.error(`Retry ${platform} failed`, error);
      setStatus(prev => prev ? ({ ...prev, [platform]: 'error' }) : null);
    } finally {
      setIsSending(false);
    }
  }, [config, message, attachments, showEmbedBuilder, embedConfig, isSending]);

  const handleSend = useCallback(async () => {
    if (isSending) return;
    if (!message.trim() && attachments.length === 0 && (!showEmbedBuilder || !embedConfig.title)) return;
    if (!platforms.discord && !platforms.telegram) return;

    setIsSending(true);
    setStatus(null);

    const results: SendingStatus = {
      discord: platforms.discord ? 'pending' : 'skipped',
      telegram: platforms.telegram ? 'pending' : 'skipped'
    };

    try {
      // Parallel execution
      const promises = [];

      if (platforms.discord) {
        if (!config.discordWebhook) {
          results.discord = 'error';
        } else {
          // Pass embed config only if enabled and Discord is active
          const embedData = showEmbedBuilder ? embedConfig : undefined;
          
          promises.push(
            sendToDiscord(config.discordWebhook, message, attachments, embedData)
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
          // Telegram doesn't support Discord-style embeds, so we append embed content to text if needed
          let finalMsg = message;
          if (showEmbedBuilder && platforms.telegram) {
             finalMsg += `\n\n**${embedConfig.title}**\n${embedConfig.description}`;
          }

          promises.push(
            sendToTelegram(config.telegramBotToken, config.telegramChatId, finalMsg, attachments)
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

      // Save History
      const activePlatforms = Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k) as ('discord' | 'telegram')[];
      const allSuccess = activePlatforms.every(p => results[p] === 'success');
      
      if (allSuccess) {
         addToHistory({
             text: message || (showEmbedBuilder ? `[Embed] ${embedConfig.title}` : '[Attachment Only]'),
             platforms: activePlatforms,
             status: 'success'
         });

        setTimeout(() => {
          handleClear();
        }, 3000);
      } else {
         // Save as partial success if some passed
         if (results.discord === 'success' || results.telegram === 'success') {
             addToHistory({
                 text: message,
                 platforms: activePlatforms,
                 status: 'partial'
             });
         }
      }

    } catch (error) {
      console.error("Global send error", error);
    } finally {
      setIsSending(false);
    }
  }, [message, attachments, platforms, config, isSending, showEmbedBuilder, embedConfig]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
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
    return <FileText className={className} />;
  };

  return (
    <div 
      className="h-[100dvh] flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-300 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-zinc-400 dark:border-zinc-600 m-4 rounded-3xl animate-in fade-in duration-200">
           <div className="text-white text-xl font-medium flex flex-col items-center gap-4">
              <Paperclip className="w-12 h-12" />
              Drop files to attach
           </div>
        </div>
      )}
      
      {/* Header (Mobile Only) */}
      <header className="flex-none md:hidden sticky top-0 z-40 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex justify-between items-center">
        <h1 className="text-xl font-serif font-semibold tracking-tight">KokoSend</h1>
        <div className="flex gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              <Clock className="w-5 h-5" />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="hidden md:flex w-full md:w-64 lg:w-72 h-full border-r border-zinc-200 dark:border-zinc-800 p-6 flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-serif font-bold tracking-tight">KokoSend</h1>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider font-mono text-zinc-500">Destinations</p>
            <button onClick={() => togglePlatform('discord')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ease-out active:scale-[0.98] ${platforms.discord ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>
              <Bot className="w-5 h-5" /> <span className="font-medium">Discord</span>
            </button>
            <button onClick={() => togglePlatform('telegram')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ease-out active:scale-[0.98] ${platforms.telegram ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>
              <Send className="w-5 h-5" /> <span className="font-medium">Telegram</span>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
           <button onClick={() => setIsHistoryOpen(true)} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
             <Clock className="w-4 h-4" /> <span>History</span>
           </button>
           <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
             <Settings className="w-4 h-4" />
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 max-w-4xl mx-auto w-full">
        
          {/* Mobile Platform Toggles */}
          <div className="flex-none flex md:hidden gap-3 mb-4">
            <button onClick={() => togglePlatform('discord')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${platforms.discord ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200'}`}>
              <Bot className="w-5 h-5" /> <span>Discord</span>
            </button>
            <button onClick={() => togglePlatform('telegram')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${platforms.telegram ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200'}`}>
              <Send className="w-5 h-5" /> <span>Telegram</span>
            </button>
          </div>

          {/* Status Bar */}
          {status && (
            <div className="flex-none mb-6 grid gap-2">
              {Object.entries(status).map(([key, val]) => {
                  if(!platforms[key as keyof typeof platforms] && val === 'skipped') return null;
                  return (
                    <div 
                      key={key} 
                      className={`p-3 rounded-xl border text-sm flex items-center gap-2 transition-colors ${
                        val === 'success' 
                          ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300' 
                          : val === 'error' 
                            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400' 
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                        {val === 'success' 
                          ? <CheckCircle2 className="w-4 h-4" /> 
                          : val === 'error' 
                            ? <AlertCircle className="w-4 h-4" /> 
                            : <Clock className="w-4 h-4 animate-pulse" />
                        }
                        <span className={`capitalize flex-1 ${val === 'error' ? 'font-semibold' : ''}`}>{key}: {val}</span>

                        {val === 'error' && (
                            <button 
                                onClick={() => handleRetry(key as 'discord' | 'telegram')}
                                disabled={isSending}
                                className="p-1 hover:bg-red-200 dark:hover:bg-red-900/40 rounded transition-colors disabled:opacity-50"
                                title="Retry"
                            >
                                <RefreshCw className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                    </div>
                  );
              })}
            </div>
          )}

          {/* Editor Container */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
            
            {/* Toolbar */}
            <div className="flex-none px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
               <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'edit' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Write
                  </button>
                  <button 
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'preview' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Preview
                  </button>
               </div>

               {platforms.discord && (
                 <button 
                   onClick={() => setShowEmbedBuilder(!showEmbedBuilder)}
                   className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${showEmbedBuilder ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                 >
                   <LayoutTemplate className="w-4 h-4" />
                   <span className="hidden sm:inline">Embed Builder</span>
                 </button>
               )}
            </div>

            {/* Embed Builder Panel */}
            {showEmbedBuilder && platforms.discord && viewMode === 'edit' && (
              <div className="flex-none p-4 bg-indigo-50/30 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20 space-y-3 animate-in slide-in-from-top-2">
                 <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Embed Title"
                      value={embedConfig.title}
                      onChange={e => setEmbedConfig(p => ({...p, title: e.target.value}))}
                      className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/30 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input 
                      type="color" 
                      value={embedConfig.color}
                      onChange={e => setEmbedConfig(p => ({...p, color: e.target.value}))}
                      className="w-10 h-[38px] p-0.5 rounded-lg bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/30 cursor-pointer"
                    />
                 </div>
                 <textarea
                    placeholder="Embed Description (Optional)"
                    value={embedConfig.description}
                    onChange={e => setEmbedConfig(p => ({...p, description: e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/30 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-20"
                 />
              </div>
            )}

            {/* Main Editor Area */}
            {viewMode === 'edit' ? (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={handlePaste}
                placeholder={showEmbedBuilder ? "Add regular message content (optional)..." : "Type your message here... (Supports Markdown, paste images)"}
                className="flex-1 resize-none bg-transparent p-4 md:p-6 outline-none text-base md:text-lg text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 font-mono overflow-y-auto"
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 p-6 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50">
                 {/* Simulate Discord Message */}
                 <div className="flex gap-3 max-w-full">
                    <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                       <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-medium text-zinc-900 dark:text-zinc-200">KokoBot</span>
                          <span className="text-xs text-zinc-400">Today at 12:00 PM</span>
                       </div>
                       
                       {/* Text Content */}
                       {message && (
                         <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none mb-2">
                            <ReactMarkdown>{message}</ReactMarkdown>
                         </div>
                       )}

                       {/* Embed Preview */}
                       {showEmbedBuilder && embedConfig.title && (
                         <div className="border-l-4 rounded bg-zinc-100 dark:bg-zinc-950 p-3 max-w-md" style={{ borderColor: embedConfig.color }}>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">{embedConfig.title}</div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{embedConfig.description}</div>
                         </div>
                       )}

                       {/* Attachments Preview */}
                       {attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                             {attachments.map(att => (
                               att.preview ? (
                                 <img key={att.id} src={att.preview} alt="" className="h-32 rounded-lg border border-zinc-200 dark:border-zinc-800" />
                               ) : (
                                 <div key={att.id} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center gap-2 text-sm text-zinc-500">
                                   <FileText className="w-4 h-4" /> {att.file.name}
                                 </div>
                               )
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            )}

            {/* Attachments List */}
            {attachments.length > 0 && viewMode === 'edit' && (
              <div className="flex-none px-6 py-4 flex flex-wrap gap-3 max-h-[150px] overflow-y-auto border-t border-zinc-50 dark:border-zinc-900">
                {attachments.map((att) => (
                  <div key={att.id} className="group relative flex items-center gap-3 pl-2 pr-10 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm">
                    {att.preview ? (
                      <div className="w-10 h-10 flex-shrink-0">
                        <img src={att.preview} alt={att.file.name} className="w-full h-full object-cover rounded-lg border border-zinc-200 dark:border-zinc-800" />
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

                    <button onClick={() => removeAttachment(att.id)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex-none p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  
                  {/* Left: Tools */}
                  <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4">
                      <div className="flex items-center gap-4">
                          <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors group relative" title="Attach file">
                            <Paperclip className="w-5 h-5 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          </button>
                          <span className="text-xs font-mono text-zinc-400">
                            {message.length} chars
                          </span>
                          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleFileSelect(e.target.files)} />
                      </div>
                      
                      {(message || attachments.length > 0 || (showEmbedBuilder && embedConfig.title)) && (
                        <button onClick={handleClear} className="md:hidden p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors" title="Clear message">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                  </div>

                  {/* Right: Actions */}
                  <div className="w-full md:w-auto flex items-center gap-3">
                     {(message || attachments.length > 0 || (showEmbedBuilder && embedConfig.title)) && (
                       <button onClick={handleClear} className="hidden md:block p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors" title="Clear message">
                         <Trash2 className="w-5 h-5" />
                       </button>
                     )}

                     <button
                      onClick={handleSend}
                      disabled={isSending || (!message && attachments.length === 0 && (!showEmbedBuilder || !embedConfig.title))}
                      className="w-full md:w-auto px-8 py-3 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-200 shadow-lg shadow-zinc-200 dark:shadow-zinc-900/20 group relative flex items-center justify-center min-w-[160px]"
                     >
                        {isSending ? (
                           <Clock className="w-5 h-5 animate-pulse" />
                        ) : (
                           'Send Message'
                        )}
                        {!isSending && (
                          <div className="hidden md:block absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <kbd className="inline-flex h-5 items-center gap-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-500 dark:text-zinc-400 shadow-sm">
                              <span className="text-xs">⌘</span>Enter
                            </kbd>
                          </div>
                        )}
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

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={config} onSave={setConfig} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onRestore={(text) => setMessage(text)} />
    </div>
  );
}