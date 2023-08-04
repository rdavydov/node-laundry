const { Telegraf } = require('telegraf');
const db = require('./database');
const config = require('./config');
const reservations = require('./reservations');
const notifications = require('./notifications');
const language = require('./language');

// Initialize the Telegram bot with your bot token from config.js
const bot = new Telegraf(config.telegramToken);

// Middleware to set the user's preferred language
bot.use((ctx, next) => {
    const lang = ctx.message.from.language_code;
    ctx.i18n = language(lang);
    return next();
});

// Command handler for the /start command
bot.start((ctx) => {
    const userId = ctx.message.from.id;

    // Check if the user is already registered in the database
    db.get('SELECT * FROM users WHERE telegram_id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error checking user information:', err);
            return ctx.reply(ctx.i18n.t('genericError'));
        }

        if (!user) {
            // If the user is not registered, prompt them to enter their information
            ctx.reply(ctx.i18n.t('registrationPrompt'));
        } else {
            // If the user is registered, display the main menu
            ctx.reply(ctx.i18n.t('mainMenuPrompt'));
        }
    });
});

// Command handler for the /language command to switch the language
bot.command('language', (ctx) => {
    const lang = ctx.message.text.split(' ')[1];

    if (language(lang)) {
        // Set the user's preferred language in the database
        const userId = ctx.message.from.id;
        db.run('UPDATE users SET preferred_language = ? WHERE telegram_id = ?', [lang, userId], (err) => {
            if (err) {
                console.error('Error updating preferred language:', err);
                return ctx.reply(ctx.i18n.t('languageError'));
            }

            ctx.i18n = language(lang);
            return ctx.reply(ctx.i18n.t('languageSwitchSuccess'));
        });
    } else {
        return ctx.reply(ctx.i18n.t('languageSwitchError'));
    }
});

// Command handler for the /reserve command
bot.command('reserve', (ctx) => {
    const userId = ctx.message.from.id;
    const message = ctx.message.text;
    const [command, startTime, endTime] = message.split(' ');

    if (!startTime || !endTime) {
        return ctx.reply(ctx.i18n.t('reserveFormatError'));
    }

    // Convert the start and end time strings to timestamps
    const startTimeStamp = Date.parse(startTime);
    const endTimeStamp = Date.parse(endTime);

    if (isNaN(startTimeStamp) || isNaN(endTimeStamp)) {
        return ctx.reply(ctx.i18n.t('reserveTimeParseError'));
    }

    // Call the reserve function from reservations.js
    reservations.reserve(ctx.message.chat.id, userId, startTimeStamp, endTimeStamp);
});

// Command handler for the /view command
bot.command('view', (ctx) => {
    const userId = ctx.message.from.id;

    // Call the view function from reservations.js
    reservations.view(ctx.message.chat.id, userId);
});

// Command handler for the /cancel command
bot.command('cancel', (ctx) => {
    const userId = ctx.message.from.id;
    const message = ctx.message.text;
    const [command, reservationNumber] = message.split(' ');

    if (!reservationNumber || isNaN(reservationNumber)) {
        return ctx.reply(ctx.i18n.t('cancelFormatError'));
    }

    // Call the cancel function from reservations.js
    reservations.cancel(ctx.message.chat.id, userId, parseInt(reservationNumber));
});

// Command handler for the /settings command
bot.command('settings', (ctx) => {
    const userId = ctx.message.from.id;

    // Call the settings function from reservations.js
    reservations.settings(ctx.message.chat.id, userId);
});

// Start the bot
bot.launch().then(() => {
    console.log('Bot is running.');
});

// Error handling for the bot
bot.catch((err) => {
    console.error('Error in bot:', err);
});

// Schedule notifications for existing reservations when the bot starts
db.all('SELECT * FROM reservations', (err, reservations) => {
    if (err) {
        console.error('Error fetching reservations:', err);
        return;
    }

    for (const reservation of reservations) {
        notifications.sendStartNotification(bot, reservation.user_id, reservation.id);
        notifications.sendEndNotification(bot, reservation.user_id, reservation.id);
    }
});

// In this file, we handle various commands such as /start, /language, /reserve, /view, /cancel, and /settings. We also set up a middleware to determine the user's preferred language and store it in the ctx.i18n object for internationalization support.

// The bot.start handler checks if the user is already registered in the database and prompts them to enter their information if not, or displays the main menu if the user is registered.

// The /language command allows users to switch their preferred language and updates the preferred_language field in the database accordingly.

// The /reserve, /view, /cancel, and /settings commands are handled by calling the respective functions from reservations.js to perform the related actions.

// Additionally, we schedule notifications for existing reservations when the bot starts by calling sendStartNotification and sendEndNotification functions from notifications.js.