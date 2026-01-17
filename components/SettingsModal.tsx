import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { AppConfig } from '../types';
import { PRESETS } from '../presets';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  // Sync when opening
  useEffect(() => {
    if (isOpen) setLocalConfig(config);
  }, [isOpen, config]);

  const handleChange = (field: keyof AppConfig, value: string) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const loadPreset = (name: string) => {
    const preset = PRESETS.find(p => p.name === name);
    if (preset) {
      setLocalConfig(preset.config);
    }
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div 
        className="absolute inset-0 bg-white/60 dark:bg-zinc-950/80 backdrop-blur-md" 
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-50">Configuration</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Close settings">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset.name)}
                className="px-3 py-1.5 text-xs font-mono border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-50 dark:hover:text-zinc-900 transition-colors"
                aria-label={`Load preset ${preset.name}`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Discord Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Discord Webhook URL</label>
            <input
              type="password"
              value={localConfig.discordWebhook}
              onChange={(e) => handleChange('discordWebhook', e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-sm transition-shadow"
            />
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800"></div>

          {/* Telegram Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Telegram Bot Token</label>
            <input
              type="password"
              value={localConfig.telegramBotToken}
              onChange={(e) => handleChange('telegramBotToken', e.target.value)}
              placeholder="123456:ABC-DEF1234ghIkl..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-sm transition-shadow"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Telegram Chat ID</label>
            <input
              type="text"
              value={localConfig.telegramChatId}
              onChange={(e) => handleChange('telegramChatId', e.target.value)}
              placeholder="-100..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-sm transition-shadow"
            />
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};