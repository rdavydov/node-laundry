const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const DATABASE_PATH = 'laundry_reservation_web.db';

// Create and initialize the database
async function initializeDatabase() {
    try {
        const db = await open({
            filename: DATABASE_PATH,
            driver: sqlite3.Database,
        });

        // Create the reservations table if it doesn't exist
        await db.exec(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY,
        roomNumber INTEGER NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        startTime DATETIME NOT NULL,
        endTime DATETIME NOT NULL
      )
    `);

        // Create the notification settings table if it doesn't exist
        await db.exec(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        userId TEXT PRIMARY KEY,
        enableNotifications BOOLEAN DEFAULT 0,
        notificationTime INTEGER DEFAULT 15
      )
    `);

        console.log('Web database initialized.');
        return db;
    } catch (error) {
        console.error('Error initializing web database:', error);
        throw error;
    }
}

// Make a reservation in the web database
async function reserve(roomNumber, firstName, lastName, phoneNumber, startTime, endTime) {
    try {
        const db = await initializeDatabase();
        const result = await db.run(
            'INSERT INTO reservations (roomNumber, firstName, lastName, phoneNumber, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?)',
            [roomNumber, firstName, lastName, phoneNumber, startTime, endTime]
        );

        if (result.changes > 0) {
            console.log('Web reservation created:', result.lastID);
            return { success: true, reservationId: result.lastID };
        } else {
            console.log('Failed to create web reservation.');
            return { success: false };
        }
    } catch (error) {
        console.error('Error making web reservation:', error);
        throw error;
    }
}

// Cancel a reservation in the web database
async function cancel(reservationId) {
    try {
        const db = await initializeDatabase();
        const result = await db.run('DELETE FROM reservations WHERE id = ?', [reservationId]);

        if (result.changes > 0) {
            console.log('Web reservation canceled:', reservationId);
            return { success: true };
        } else {
            console.log('Failed to cancel web reservation:', reservationId);
            return { success: false };
        }
    } catch (error) {
        console.error('Error canceling web reservation:', error);
        throw error;
    }
}

// Get the list of reservations from the web database
async function getReservations() {
    try {
        const db = await initializeDatabase();
        const reservations = await db.all('SELECT * FROM reservations ORDER BY startTime');

        console.log('Fetched web reservations:', reservations);
        return reservations;
    } catch (error) {
        console.error('Error fetching web reservations:', error);
        throw error;
    }
}

// Set notification settings for a user in the web database
async function setNotificationSettings(userId, enableNotifications, notificationTime) {
    try {
        const db = await initializeDatabase();
        const result = await db.run(
            'INSERT OR REPLACE INTO notification_settings (userId, enableNotifications, notificationTime) VALUES (?, ?, ?)',
            [userId, enableNotifications, notificationTime]
        );

        if (result.changes > 0) {
            console.log('Web notification settings updated:', userId);
            return { success: true };
        } else {
            console.log('Failed to update web notification settings:', userId);
            return { success: false };
        }
    } catch (error) {
        console.error('Error configuring web notification settings:', error);
        throw error;
    }
}

// Get notification settings for a user from the web database
async function getNotificationSettings(userId) {
    try {
        const db = await initializeDatabase();
        const settings = await db.get('SELECT * FROM notification_settings WHERE userId = ?', [userId]);

        console.log('Fetched web notification settings:', settings);
        return settings;
    } catch (error) {
        console.error('Error fetching web notification settings:', error);
        throw error;
    }
}

module.exports = {
    reserve,
    cancel,
    getReservations,
    setNotificationSettings,
    getNotificationSettings,
};

// This database.js file inside the web/ directory includes all the logic to interact with the SQLite database for managing reservations and notification settings specifically for the web interface.