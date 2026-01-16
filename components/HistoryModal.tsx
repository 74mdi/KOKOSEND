import React, { useEffect, useState } from 'react';
import { X, Clock, RefreshCw, Trash2, CheckCircle2, Copy } from 'lucide-react';
import { HistoryItem } from '../types';
import { getHistory, clearHistory } from '../services/history';
import { formatDistanceToNow } from 'date-fns';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (text: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onRestore }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItems(getHistory());
    }
  }, [isOpen]);

  const handleClear = () => {
    if (confirm('Clear all history?')) {
      clearHistory();
      setItems([]);
    }
  };

  const handleRestore = (text: string) => {
    onRestore(text);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/60 dark:bg-zinc-950/80 backdrop-blur-md" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 flex-none">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-900 dark:text-zinc-50" />
            <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-50">Message History</h2>
          </div>
          <div className="flex gap-2">
            {items.length > 0 && (
                <button onClick={handleClear} className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors" title="Clear All">
                    <Trash2 className="w-5 h-5" />
                </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        <div className="p-0 overflow-y-auto flex-1">
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                    <Clock className="w-12 h-12 mb-2 opacity-20" />
                    <p>No history yet</p>
                </div>
            ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {items.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                                    <span>{formatDistanceToNow(item.timestamp, { addSuffix: true })}</span>
                                    <span>•</span>
                                    <div className="flex gap-1">
                                        {item.platforms.map(p => (
                                            <span key={p} className="uppercase bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">{p}</span>
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleRestore(item.text)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-zinc-500"
                                    title="Restore Message"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                            </div>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 whitespace-pre-wrap font-mono break-words">
                                {item.text || <span className="italic opacity-50">No text content</span>}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};