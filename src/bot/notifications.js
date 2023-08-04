const db = require('./database');

// Function to send a notification for the start of a reservation
function sendStartNotification(bot, userId, reservationId) {
    // Fetch the user's notification settings
    db.get('SELECT * FROM notification_settings WHERE user_id = ?', [userId], (err, settings) => {
        if (err) {
            console.error('Error fetching notification settings:', err);
            return;
        }

        // Check if notifications are enabled for the user
        if (!settings || !settings.enable_notifications) {
            return;
        }

        // Fetch the reservation details
        db.get('SELECT * FROM reservations WHERE id = ?', [reservationId], (err, reservation) => {
            if (err) {
                console.error('Error fetching reservation details:', err);
                return;
            }

            if (!reservation) {
                console.error('Reservation not found.');
                return;
            }

            // Calculate the notification time
            const notifyTime = reservation.start_time - (settings.notify_before_minutes * 60 * 1000);
            const now = Date.now();

            if (notifyTime > now) {
                // Schedule the notification at the calculated time
                scheduleNotification(bot, userId, reservationId, notifyTime, 'start');
            }
        });
    });
}

// Function to send a notification for the end of a reservation
function sendEndNotification(bot, userId, reservationId) {
    // Fetch the user's notification settings
    db.get('SELECT * FROM notification_settings WHERE user_id = ?', [userId], (err, settings) => {
        if (err) {
            console.error('Error fetching notification settings:', err);
            return;
        }

        // Check if notifications are enabled for the user
        if (!settings || !settings.enable_notifications) {
            return;
        }

        // Fetch the reservation details
        db.get('SELECT * FROM reservations WHERE id = ?', [reservationId], (err, reservation) => {
            if (err) {
                console.error('Error fetching reservation details:', err);
                return;
            }

            if (!reservation) {
                console.error('Reservation not found.');
                return;
            }

            // Calculate the notification time
            const notifyTime = reservation.end_time - (settings.notify_before_minutes * 60 * 1000);
            const now = Date.now();

            if (notifyTime > now) {
                // Schedule the notification at the calculated time
                scheduleNotification(bot, userId, reservationId, notifyTime, 'end');
            }
        });
    });
}

// Function to schedule notifications for reservations
function scheduleNotification(bot, userId, reservationId, notifyTime, type) {
    const delay = notifyTime - Date.now();

    // Schedule the notification using setTimeout
    setTimeout(() => {
        // Fetch the user's chatId for sending the notification
        db.get('SELECT telegram_id FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
                console.error('Error fetching user details:', err);
                return;
            }

            if (!user || !user.telegram_id) {
                console.error('User not found or missing Telegram ID.');
                return;
            }

            // Send the notification to the user
            if (type === 'start') {
                bot.telegram.sendMessage(user.telegram_id, 'Your reservation is starting soon.');
            } else if (type === 'end') {
                bot.telegram.sendMessage(user.telegram_id, 'Your reservation is ending soon.');
            }
        });
    }, delay);
}

module.exports = {
    sendStartNotification,
    sendEndNotification,
};
