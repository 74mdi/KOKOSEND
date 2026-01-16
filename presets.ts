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
      discordWebhook: 'https://discord.com/api/webhooks/1398383141630120076/ACqj56SP8VfW_zpz5vLSBkooe_VF-hIOSLQLV_LKIXPq199C_4gD6jBOkOlBc8J5yWnK',
      telegramBotToken: '8374992747:AAE_omVXZmO750W6RKq941XkCJo9UIQ73B0',
      telegramChatId: '7299643916'
    }
  },
  {
    name: 'Empty',
    config: DEFAULT_CONFIG
  }
];