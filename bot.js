const TelegramBot = require('node-telegram-bot-api');

// Bot configuration
const TOKEN = '8298006568:AAGcBsqrd6GPabkCP3Oda5CRjaXxKNztuN4';
const ADMIN_ID = 7648364004;

// Create bot instance
const bot = new TelegramBot(TOKEN, { polling: true });

// Store user states
const userStates = {};

// Main keyboard
const mainKeyboard = {
  keyboard: [
    ['💬 Contact Support'],
    ['❤️ Donate']
  ],
  resize_keyboard: true
};

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  
  // Reset user state
  delete userStates[chatId];
  
  bot.sendMessage(chatId, `Hello ${firstName}! Choose an option below:`, {
    reply_markup: mainKeyboard
  });
});

// Handle Contact Support button
bot.onText(/💬 Contact Support/, (msg) => {
  const chatId = msg.chat.id;
  
  // Set user state to waiting for support message
  userStates[chatId] = { state: 'awaiting_support_message' };
  
  bot.sendMessage(chatId, "You're now connected with the support team, enter the message you want to send:", {
    reply_markup: {
      remove_keyboard: true
    }
  });
});

// Handle Donate button
bot.onText(/❤️ Donate/, (msg) => {
  const chatId = msg.chat.id;
  
  // Set user state to waiting for donation receipt
  userStates[chatId] = { state: 'awaiting_donation_receipt' };
  
  const donateMessage = `Thank You So Much For Your Support ❤️

*Naira:*
Account Number: \`6140439769\`
Bank: OPay
Account Name: MICHAEL ISRAEL

*USDT Address:*
USDT TRC20
\`TSD4EsPVhkWzZH1v6ZzQ8GnNe5hefgGstB\`

*SOL Address:*
\`BRiosUTXtJhuKe9Bpp7WW4xw64nwL7DVTHirpwzxYpYo\`

Kindly send a receipt of your donation. Tysm ❤️`;

  bot.sendMessage(chatId, donateMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      remove_keyboard: true
    }
  });
});

// Handle all messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name + (msg.from.last_name ? ' ' + msg.from.last_name : '');
  const username = msg.from.username ? `@${msg.from.username}` : 'No username';
  
  // Skip if it's a command or button press
  if (msg.text && (msg.text.startsWith('/') || msg.text === '💬 Contact Support' || msg.text === '❤️ Donate')) {
    return;
  }
  
  const userState = userStates[chatId];
  
  // Handle support message
  if (userState && userState.state === 'awaiting_support_message') {
    try {
      // Send confirmation to user
      await bot.sendMessage(chatId, "The support team has received your response, you will get a feedback soon", {
        reply_markup: mainKeyboard
      });
      
      // Forward message to admin
      const adminMessage = `📨 *New Support Message*\n\nFrom: ${userName}\nUsername: ${username}\nUser ID: \`${userId}\`\n\n*Message:*\n${msg.text || '[Media/Other content]'}`;
      
      await bot.sendMessage(ADMIN_ID, adminMessage, { parse_mode: 'Markdown' });
      
      // If there's media, forward it too
      if (msg.photo || msg.document || msg.video || msg.audio || msg.voice) {
        await bot.forwardMessage(ADMIN_ID, chatId, msg.message_id);
      }
      
      // Reset user state
      delete userStates[chatId];
      
    } catch (error) {
      console.error('Error handling support message:', error);
      bot.sendMessage(chatId, "Sorry, there was an error sending your message. Please try again.", {
        reply_markup: mainKeyboard
      });
    }
  }
  
  // Handle donation receipt
  else if (userState && userState.state === 'awaiting_donation_receipt') {
    try {
      // Send thank you to user
      await bot.sendMessage(chatId, "Thank you so much for your donation! ❤️ We really appreciate your support!", {
        reply_markup: mainKeyboard
      });
      
      // Notify admin about donation
      const donationMessage = `💰 *New Donation Receipt*\n\nFrom: ${userName}\nUsername: ${username}\nUser ID: \`${userId}\`\n\n${msg.text || 'Receipt attached below:'}`;
      
      await bot.sendMessage(ADMIN_ID, donationMessage, { parse_mode: 'Markdown' });
      
      // Forward the actual message/media
      await bot.forwardMessage(ADMIN_ID, chatId, msg.message_id);
      
      // Reset user state
      delete userStates[chatId];
      
    } catch (error) {
      console.error('Error handling donation receipt:', error);
      bot.sendMessage(chatId, "Thank you for your donation! ❤️", {
        reply_markup: mainKeyboard
      });
    }
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('✅ iDev Support Bot is running...');
