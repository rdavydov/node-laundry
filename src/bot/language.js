// Language translation logic

// Define language resources
const resources = {
    en: {
        welcomeMessage: 'Welcome to the Laundry Room Reservation Bot!',
        registrationPrompt: 'Please enter your room number, First and Last name, and phone number to proceed.',
        mainMenuPrompt: 'Main Menu:\n1. /reserve [start_time] [end_time] - Make a reservation\n2. /view - View your reservations\n3. /cancel [reservation_number] - Cancel a reservation\n4. /settings - Configure notification settings\n5. /language [language_code] - Change your language',
        reserveFormatError: 'Invalid format. Use: /reserve [start_time] [end_time]',
        reserveTimeParseError: 'Error parsing reservation time. Make sure to use a valid date/time format.',
        cancelFormatError: 'Invalid format. Use: /cancel [reservation_number]',
        languageSwitchSuccess: 'Language switched successfully.',
        languageSwitchError: 'Invalid language code. Please use a valid language code (e.g., "en" for English).',
        genericError: 'An error occurred. Please try again later.',
    },
    ru: {
        welcomeMessage: 'Добро пожаловать в бот для бронирования прачечной!',
        registrationPrompt: 'Введите номер комнаты, имя и фамилию, а также номер телефона для продолжения.',
        mainMenuPrompt: 'Главное меню:\n1. /reserve [start_time] [end_time] - Забронировать время\n2. /view - Посмотреть ваши бронирования\n3. /cancel [reservation_number] - Отменить бронирование\n4. /settings - Настроить уведомления\n5. /language [language_code] - Сменить язык',
        reserveFormatError: 'Неверный формат. Используйте: /reserve [start_time] [end_time]',
        reserveTimeParseError: 'Ошибка при разборе времени бронирования. Убедитесь, что используете правильный формат даты/времени.',
        cancelFormatError: 'Неверный формат. Используйте: /cancel [reservation_number]',
        languageSwitchSuccess: 'Язык успешно изменен.',
        languageSwitchError: 'Неверный код языка. Пожалуйста, используйте корректный код языка (например, "ru" для русского языка).',
        genericError: 'Произошла ошибка. Пожалуйста, попробуйте еще раз позже.',
    },
};

// Function to get language resources based on the selected language
function language(lang) {
    // Default language is English
    let selectedLang = 'en';

    // If the provided language is supported, use it
    if (resources[lang]) {
        selectedLang = lang;
    }

    // Function to translate a given key to the selected language
    function t(key) {
        return resources[selectedLang][key] || resources['en'][key];
    }

    return {
        t,
    };
}

module.exports = language;

// In this file, we define the resources object that contains language resources for English (en) and Russian (ru). You can add more languages and translation resources as needed.

// The language function is responsible for returning the language translation function based on the selected language code. If the provided language code is supported, the function returns the translation resources for that language; otherwise, it falls back to English (en) as the default language.

// The t function within the returned object is used for translation. It takes a key as an argument and returns the corresponding translation from the selected language. If the translation for the given key is not available in the selected language, it falls back to the English translation.

// Remember to adjust the resources object with translations according to your desired languages and the specific messages you want to display in your Telegram bot.