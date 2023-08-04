const db = require('./database');

// Function to handle reservation process and time slot selection
function reserve(chatId, userId, startTime, endTime) {
    const now = Date.now();

    // Check if the start time is in the past
    if (startTime <= now) {
        return bot.sendMessage(chatId, 'Please choose a future time for your reservation.');
    }

    // Check if the end time is before the start time
    if (endTime <= startTime) {
        return bot.sendMessage(chatId, 'The end time must be after the start time.');
    }

    // Check if the reservation duration is more than 1 hour
    const duration = endTime - startTime;
    const maxDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    if (duration > maxDuration) {
        return bot.sendMessage(chatId, 'Reservations cannot exceed 1 hour.');
    }

    // Check if the user has provided their information
    db.get('SELECT * FROM users WHERE telegram_id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error checking user information:', err);
            return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
        }

        if (!user) {
            return bot.sendMessage(chatId, 'Please enter your room number, First and Last name, and phone number to proceed.');
        }

        // Check if the user already has a reservation at the chosen time
        db.get('SELECT * FROM reservations WHERE user_id = ? AND ((start_time <= ? AND end_time >= ?) OR (start_time <= ? AND end_time >= ?))',
            [user.id, startTime, startTime, endTime, endTime],
            (err, existingReservation) => {
                if (err) {
                    console.error('Error checking existing reservation:', err);
                    return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
                }

                if (existingReservation) {
                    return bot.sendMessage(chatId, 'You already have a reservation at that time.');
                }

                // Create a new reservation
                db.run('INSERT INTO reservations (user_id, start_time, end_time) VALUES (?, ?, ?)',
                    [user.id, startTime, endTime],
                    (err) => {
                        if (err) {
                            console.error('Error creating reservation:', err);
                            return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
                        }

                        return bot.sendMessage(chatId, 'Your reservation has been successfully made.');
                    }
                );
            }
        );
    });
}

// Function to handle viewing current reservations and available time slots
function view(chatId, userId) {
    db.get('SELECT * FROM users WHERE telegram_id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error checking user information:', err);
            return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
        }

        if (!user) {
            return bot.sendMessage(chatId, 'Please enter your room number, First and Last name, and phone number to proceed.');
        }

        // Get the user's reservations
        db.all('SELECT * FROM reservations WHERE user_id = ?', [user.id], (err, reservations) => {
            if (err) {
                console.error('Error fetching reservations:', err);
                return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
            }

            if (reservations.length === 0) {
                return bot.sendMessage(chatId, 'You have no reservations.');
            }

            // Format and send the reservations list
            const reservationsList = reservations.map((reservation, index) => {
                const start = new Date(reservation.start_time).toLocaleString();
                const end = new Date(reservation.end_time).toLocaleString();
                return `${index + 1}. Start: ${start}, End: ${end}`;
            }).join('\n');

            return bot.sendMessage(chatId, 'Your reservations:\n' + reservationsList);
        });
    });
}

// Function to handle canceling an existing reservation
function cancel(chatId, userId, reservationNumber) {
    db.get('SELECT * FROM users WHERE telegram_id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error checking user information:', err);
            return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
        }

        if (!user) {
            return bot.sendMessage(chatId, 'Please enter your room number, First and Last name, and phone number to proceed.');
        }

        // Get the user's reservations
        db.all('SELECT * FROM reservations WHERE user_id = ?', [user.id], (err, reservations) => {
            if (err) {
                console.error('Error fetching reservations:', err);
                return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
            }

            if (reservations.length === 0) {
                return bot.sendMessage(chatId, 'You have no reservations to cancel.');
            }

            const reservationToCancel = reservations[reservationNumber - 1];

            if (!reservationToCancel) {
                return bot.sendMessage(chatId, 'Invalid reservation number.');
            }

            // Delete the reservation
            db.run('DELETE FROM reservations WHERE id = ?', [reservationToCancel.id], (err) => {
                if (err) {
                    console.error('Error canceling reservation:', err);
                    return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
                }

                return bot.sendMessage(chatId, 'Your reservation has been canceled.');
            });
        });
    });
}

// Function to handle configuring notification preferences
function settings(chatId, userId) {
    // Check if the user has provided their information
    db.get('SELECT * FROM users WHERE telegram_id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error checking user information:', err);
            return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
        }

        if (!user) {
            return bot.sendMessage(chatId, 'Please enter your room number, First and Last name, and phone number to proceed.');
        }

        // Check if the user already has notification preferences
        db.get('SELECT * FROM notification_settings WHERE user_id = ?', [user.id], (err, settings) => {
            if (err) {
                console.error('Error fetching notification settings:', err);
                return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
            }

            if (!settings) {
                // If notification settings don't exist, create a new entry
                db.run('INSERT INTO notification_settings (user_id, enable_notifications, notify_before_minutes) VALUES (?, ?, ?)',
                    [user.id, true, 15], // Default settings: enable notifications and notify 15 minutes before
                    (err) => {
                        if (err) {
                            console.error('Error creating notification settings:', err);
                            return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
                        }

                        return sendSettingsMenu(chatId, user.id, true, 15);
                    }
                );
            } else {
                // If notification settings exist, display the settings menu
                return sendSettingsMenu(chatId, user.id, settings.enable_notifications, settings.notify_before_minutes);
            }
        });
    });
}

// Function to send the notification settings menu
function sendSettingsMenu(chatId, userId, enableNotifications, notifyBeforeMinutes) {
    const enableNotificationsText = enableNotifications ? 'ON' : 'OFF';
    bot.sendMessage(chatId, `Notification Settings:
  1. Enable Notifications: ${enableNotificationsText}
  2. Notify Me Before: ${notifyBeforeMinutes} minutes`);

    bot.once('message', (msg) => {
        const selectedOption = parseInt(msg.text);
        if (selectedOption === 1 || selectedOption === 2) {
            if (selectedOption === 1) {
                // Toggle enableNotifications value
                enableNotifications = !enableNotifications;
            } else {
                // Ask for the new notification time in minutes
                bot.sendMessage(chatId, 'Enter the number of minutes before the reservation to receive notifications:');
                bot.once('message', (msg) => {
                    const newNotifyBeforeMinutes = parseInt(msg.text);
                    if (Number.isNaN(newNotifyBeforeMinutes)) {
                        return bot.sendMessage(chatId, 'Invalid input. Please enter a valid number of minutes.');
                    }

                    // Update the notification settings in the database
                    db.run('UPDATE notification_settings SET enable_notifications = ?, notify_before_minutes = ? WHERE user_id = ?',
                        [enableNotifications, newNotifyBeforeMinutes, userId],
                        (err) => {
                            if (err) {
                                console.error('Error updating notification settings:', err);
                                return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
                            }

                            return bot.sendMessage(chatId, 'Notification settings updated successfully.');
                        }
                    );
                });
                return;
            }

            // Update the notification settings in the database
            db.run('UPDATE notification_settings SET enable_notifications = ? WHERE user_id = ?',
                [enableNotifications, userId],
                (err) => {
                    if (err) {
                        console.error('Error updating notification settings:', err);
                        return bot.sendMessage(chatId, 'An error occurred. Please try again later.');
                    }

                    return bot.sendMessage(chatId, 'Notification settings updated successfully.');
                }
            );
        } else {
            return bot.sendMessage(chatId, 'Invalid option. Please choose a valid option (1 or 2).');
        }
    });
}

module.exports = {
    reserve,
    view,
    cancel,
    settings,
};

//   In this implementation, the settings function now includes the logic for displaying the notification settings menu to the user.The function first checks if the user has provided their information and if they have existing notification settings.If the settings don't exist, a new entry is created with default settings (enabled notifications and notification before 15 minutes). The settings menu is then displayed with options to enable/disable notifications and to set the notification time in minutes.

//   When the user makes a selection in the menu, the function handles the update of the notification settings in the database accordingly.