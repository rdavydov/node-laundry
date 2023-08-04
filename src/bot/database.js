const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path to the SQLite database file
const dbPath = path.resolve(__dirname, 'laundry_bot.db');

// Initialize the database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the database.');
    }
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      telegram_id TEXT NOT NULL UNIQUE,
      room_number TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone_number TEXT NOT NULL
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      user_id INTEGER PRIMARY KEY,
      enable_notifications INTEGER NOT NULL DEFAULT 1,
      notify_before_minutes INTEGER NOT NULL DEFAULT 15,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
});

module.exports = db;
