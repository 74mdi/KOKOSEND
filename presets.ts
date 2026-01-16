import { Preset } from './types';

export const DEFAULT_CONFIG = {
  discordWebhook: '',
  telegramBotToken: '',
  telegramChatId: '',
};

export const PRESETS: Preset[] = [
  {
    name: '7amdi',
    config: {
      discordWebhook: 'https://discord.com/api/webhooks/1234567890/abcdefg',
      telegramBotToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
      telegramChatId: '-1001234567890'
    }
  },
  {
    name: 'Empty',
    config: DEFAULT_CONFIG
  }
];