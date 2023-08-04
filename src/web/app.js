const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const { language } = require('../bot/language'); // Assuming the language.js file is in the bot folder
const { reserve, cancel, getReservations, setNotificationSettings, getNotificationSettings } = require('./database');
const config = require('../bot/config');

const app = express();
const port = process.env.PORT || 3000;

// Set the view engine and views directory
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (css, js, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Language middleware to set the language based on user preferences (default: 'en')
app.use((req, res, next) => {
    // Assuming you have a way to get the user's preferred language (e.g., from a database)
    const userLanguage = 'en'; // Replace with actual user's language preference

    // Get the language translation function based on the user's preferred language
    req.lang = language(userLanguage);
    next();
});

// Middleware for authentication and authorization
function authenticate(req, res, next) {
    // Get the token from the request headers
    const token = req.header('Authorization');

    // Check if the token exists
    if (!token) {
        return res.status(401).json({ success: false, message: req.lang.t('unauthorized') });
    }

    // Verify the token
    jwt.verify(token, config.secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: req.lang.t('forbidden') });
        }

        // Store the user ID in the request for future use
        req.userId = decoded.userId;

        // Check if the user is the admin based on adminUsername and adminPassword from config
        if (req.userId !== config.adminUsername || req.userId !== config.adminPassword) {
            return res.status(403).json({ success: false, message: req.lang.t('forbidden') });
        }

        next();
    });
}

// Render the main reservation page
app.get('/', (req, res) => {
    res.render('index');
});

// Render the admin panel page
app.get('/admin', authenticate, (req, res) => {
    // Check if the user is the admin based on adminUsername from config
    if (req.userId !== config.adminUsername) {
        return res.status(403).json({ success: false, message: req.lang.t('forbidden') });
    }
    res.render('admin');
});

// API endpoint to make a reservation
app.post('/reserve', async (req, res) => {
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
app.post('/cancel', authenticate, async (req, res) => {
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
app.get('/reservations', authenticate, async (req, res) => {
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
app.post('/settings', authenticate, async (req, res) => {
    const { userId, enableNotifications, notificationTime } = req.body;

    try {
        // Perform input validation (you can add more validation as needed)
        if (!userId || typeof enableNotifications !== 'boolean' || isNaN(notificationTime)) {
            return res.json({ success: false, message: req.lang.t('settingsFormatError') });
        }

        // Check if the requested user ID matches the authenticated user's ID
        if (req.userId !== userId) {
            return res.status(403).json({ success: false, message: req.lang.t('forbidden') });
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
app.get('/settings/:userId', authenticate, async (req, res) => {
    // Check if the requested user ID matches the authenticated user's ID
    if (req.userId !== req.params.userId) {
        return res.status(403).json({ success: false, message: req.lang.t('forbidden') });
    }

    try {
        // Call the database function to get the notification settings for the user
        const settings = await getNotificationSettings(req.userId);

        // Return the notification settings as JSON
        return res.json({ success: true, settings });
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        return res.json({ success: false, message: req.lang.t('genericError') });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
