export interface AppConfig {
  discordWebhook: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface Preset {
  name: string;
  config: AppConfig;
}

export interface Attachment {
  file: File;
  id: string;
  preview?: string;
}

export interface SendingStatus {
  discord: 'pending' | 'success' | 'error' | 'skipped';
  telegram: 'pending' | 'success' | 'error' | 'skipped';
}

export interface DiscordEmbed {
  title: string;
  description: string;
  color: string;
  url?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  text: string;
  platforms: ('discord' | 'telegram')[];
  status: 'success' | 'partial';
}