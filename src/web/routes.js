const express = require('express');
const { language } = require('../bot/language'); // Assuming the language.js file is in the bot folder
const { reserve, cancel, getReservations, setNotificationSettings, getNotificationSettings } = require('./database');

const router = express.Router();

// Language middleware to set the language based on user preferences (default: 'en')
router.use((req, res, next) => {
    // Assuming you have a way to get the user's preferred language (e.g., from a database)
    const userLanguage = 'en'; // Replace with actual user's language preference

    // Get the language translation function based on the user's preferred language
    req.lang = language(userLanguage);
    next();
});

// API endpoint to make a reservation
router.post('/reserve', async (req, res) => {
    const { roomNumber, firstName, lastName, phoneNumber, startTime, endTime } = req.body;

    try {
        // Perform input validation (you can add more validation as needed)
        if (!roomNumber || !firstName || !lastName || !phoneNumber || !startTime || !endTime) {
            return res.json({ success: false, message: req.lang.t('reserveFormatError') });
        }

        // Check if reservation time is valid (you can add more checks as needed)
        const startTimestamp = Date.parse(startTime);
        const endTimestamp = Date.parse(endTime);
        if (isNaN(startTimestamp) || isNaN(endTimestamp) || startTimestamp >= endTimestamp) {
            return res.json({ success: false, message: req.lang.t('reserveTimeParseError') });
        }

        // Call the database function to make a reservation
        const result = await reserve(roomNumber, firstName, lastName, phoneNumber, startTime, endTime);

        // Check if the reservation was successful
        if (result.success) {
            return res.json({ success: true, message: req.lang.t('reserveSuccess') });
        } else {
            return res.json({ success: false, message: req.lang.t('genericError') });
        }
    } catch (error) {
        console.error('Error making reservation:', error);
        return res.json({ success: false, message: req.lang.t('genericError') });
    }
});

// API endpoint to cancel a reservation
router.post('/cancel', async (req, res) => {
    const { reservationId } = req.body;

    try {
        // Perform input validation (you can add more validation as needed)
        if (!reservationId) {
            return res.json({ success: false, message: req.lang.t('cancelFormatError') });
        }

        // Call the database function to cancel the reservation
        const result = await cancel(reservationId);

        // Check if the cancellation was successful
        if (result.success) {
            return res.json({ success: true, message: req.lang.t('cancelSuccess') });
        } else {
            return res.json({ success: false, message: req.lang.t('genericError') });
        }
    } catch (error) {
        console.error('Error canceling reservation:', error);
        return res.json({ success: false, message: req.lang.t('genericError') });
    }
});

// API endpoint to get the list of reservations
router.get('/reservations', async (req, res) => {
    try {
        // Call the database function to get the list of reservations
        const reservations = await getReservations();

        // Return the list of reservations as JSON
        return res.json({ success: true, reservations });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return res.json({ success: false, message: req.lang.t('genericError') });
    }
});

// API endpoint to configure notification settings
router.post('/settings', async (req, res) => {
    const { userId, enableNotifications, notificationTime } = req.body;

    try {
        // Perform input validation (you can add more validation as needed)
        if (!userId || typeof enableNotifications !== 'boolean' || isNaN(notificationTime)) {
            return res.json({ success: false, message: req.lang.t('settingsFormatError') });
        }

        // Call the database function to set the notification settings
        const result = await setNotificationSettings(userId, enableNotifications, notificationTime);

        // Check if the settings update was successful
        if (result.success) {
            return res.json({ success: true, message: req.lang.t('settingsSuccess') });
        } else {
            return res.json({ success: false, message: req.lang.t('genericError') });
        }
    } catch (error) {
        console.error('Error configuring notification settings:', error);
        return res.json({ success: false, message: req.lang.t('genericError') });
    }
});

// API endpoint to get the notification settings for a user
router.get('/settings/:userId', async (req, res) => {
    try {
        // Call the database function to get the notification settings for the user
        const settings = await getNotificationSettings(req.params.userId);

        // Return the notification settings as JSON
        return res.json({ success: true, settings });
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        return res.json({ success: false, message: req.lang.t('genericError') });
    }
});

module.exports = router;

// The routes.js file handles all the API endpoints and routes for the web interface. It includes logic for making reservations, canceling reservations, fetching reservations, setting notification settings, and fetching notification settings, all integrated with the appropriate functions from database.js inside the web/ directory.