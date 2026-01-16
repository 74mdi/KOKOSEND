import { Attachment } from '../types';

// Constants
const DISCORD_LIMIT = 2000;
const TELEGRAM_LIMIT = 4096;

/**
 * Creates a .txt blob from a long string
 */
const createTextFile = (content: string, filename: string = 'message.txt'): File => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  return new File([blob], filename, { type: 'text/plain' });
};

/**
 * Send to Discord via Webhook
 */
export const sendToDiscord = async (
  webhookUrl: string, 
  text: string, 
  attachments: Attachment[]
): Promise<void> => {
  const formData = new FormData();
  let finalContent = text;
  
  // Smart Limit Handling
  if (text.length > DISCORD_LIMIT) {
    finalContent = "⚠️ Message exceeded 2000 characters. Full text attached below.";
    const textFile = createTextFile(text, 'full_message.txt');
    formData.append('files[99]', textFile); // 99 to ensure it doesn't overwrite user files
  }

  // Discord allows multipart/form-data with 'content' and 'file' fields
  if (finalContent) {
    formData.append('content', finalContent);
  }

  attachments.forEach((att, index) => {
    formData.append(`files[${index}]`, att.file);
  });

  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Discord Error: ${response.status} ${response.statusText}`);
  }
};

/**
 * Helper to determine Telegram method and send a single file
 */
const sendTelegramFile = async (baseUrl: string, chatId: string, file: File) => {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  
  let method = 'sendDocument';
  let fileField = 'document';

  // Determine method based on MIME type
  if (file.type.startsWith('image/')) {
    method = 'sendPhoto';
    fileField = 'photo';
  } else if (file.type.startsWith('audio/')) {
    method = 'sendAudio';
    fileField = 'audio';
  } else if (file.type.startsWith('video/')) {
    method = 'sendVideo';
    fileField = 'video';
  }

  formData.append(fileField, file);

  const response = await fetch(`${baseUrl}/${method}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    // Fallback: If sendPhoto/Video fails (e.g. wrong format), try sendDocument
    if (method !== 'sendDocument') {
       console.warn(`Telegram ${method} failed, retrying as document...`);
       const fallbackData = new FormData();
       fallbackData.append('chat_id', chatId);
       fallbackData.append('document', file);
       const fallbackRes = await fetch(`${baseUrl}/sendDocument`, {
         method: 'POST',
         body: fallbackData
       });
       if(!fallbackRes.ok) throw new Error(`Telegram Attachment Error: ${fallbackRes.status}`);
    } else {
      throw new Error(`Telegram Attachment Error: ${response.status}`);
    }
  }
};

/**
 * Send to Telegram via Bot API
 * Utilizes sendMediaGroup for images/videos to send as an album.
 */
export const sendToTelegram = async (
  botToken: string,
  chatId: string,
  text: string,
  attachments: Attachment[]
): Promise<void> => {
  const baseUrl = `https://api.telegram.org/bot${botToken}`;
  
  // 1. Send Text
  if (text) {
    let textToSend = text;
    let textFileToSend: File | null = null;

    if (text.length > TELEGRAM_LIMIT) {
      textToSend = "⚠️ Message exceeded 4096 characters. Full text attached.";
      textFileToSend = createTextFile(text, 'full_message.txt');
    }

    // Send the primary text message
    const params = new URLSearchParams({
      chat_id: chatId,
      text: textToSend,
      parse_mode: 'Markdown',
    });
    
    const textRes = await fetch(`${baseUrl}/sendMessage?${params.toString()}`);
    if (!textRes.ok) throw new Error(`Telegram Text Error: ${textRes.status}`);

    // If text was too long, send the overflow file immediately
    if (textFileToSend) {
      await sendTelegramFile(baseUrl, chatId, textFileToSend);
    }
  }

  // 2. Separate attachments into Media Group (Photos/Videos) vs Documents
  const mediaGroupFiles: File[] = [];
  const individualFiles: File[] = [];

  attachments.forEach(att => {
    const mime = att.file.type;
    if (mime.startsWith('image/') || mime.startsWith('video/')) {
      mediaGroupFiles.push(att.file);
    } else {
      individualFiles.push(att.file);
    }
  });

  // 3. Send Media Groups (Chunks of 10)
  if (mediaGroupFiles.length > 0) {
    const CHUNK_SIZE = 10;
    for (let i = 0; i < mediaGroupFiles.length; i += CHUNK_SIZE) {
      const chunk = mediaGroupFiles.slice(i, i + CHUNK_SIZE);
      
      // Optimization: If only 1 file, send individually to avoid MediaGroup overhead
      if (chunk.length === 1) {
        await sendTelegramFile(baseUrl, chatId, chunk[0]);
        continue;
      }

      const formData = new FormData();
      formData.append('chat_id', chatId);

      const mediaItems = chunk.map((file, idx) => {
        const attachKey = `file${idx}`;
        formData.append(attachKey, file);
        return {
          type: file.type.startsWith('video/') ? 'video' : 'photo',
          media: `attach://${attachKey}`
        };
      });

      formData.append('media', JSON.stringify(mediaItems));

      const res = await fetch(`${baseUrl}/sendMediaGroup`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Telegram MediaGroup Error: ${res.status}`);
      }
    }
  }

  // 4. Send Other Files individually
  for (const file of individualFiles) {
    await sendTelegramFile(baseUrl, chatId, file);
  }
};