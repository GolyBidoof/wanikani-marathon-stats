const gifBackgrounds = [
    'fall2024.gif',
    'autumn2025.gif',
    'spring2025.gif',
    'spring2026.gif',
    'summer2024.gif',
    'summer2025.gif',
    'summer2026.gif',
    'winter2024.gif',
    'winter2025.gif'
];
let currentBg = gifBackgrounds[Math.floor(Math.random() * gifBackgrounds.length)];
let bgLoadPromise = null;

const seasonEmojis = {
    'Winter': '❄️',
    'Summer': '☀️',
    'Spring': '🌷',
    'Fall': '🍁',
    'Autumn': '🍁'
};

const accentColors = [
    '#ff00aa',
    '#00aaff',
    '#a100ff',
    '#ff5f00',
    '#00d47e',
    '#ffb800'
];
let currentAccentColor = accentColors[0];

const CANVAS_LAYOUT = {
    width: 800,
    height: 400,
    borderInset: 25,
    borderWidth: 10,
    leftX: 60,
    rightX: 800 - 60,
    statY: 330,
    historyYStart: 75,
    fontTitle: "700 42px Outfit, Open Sans, sans-serif",
    fontTagline: "600 14px Outfit, Open Sans, sans-serif",
    fontTimeBig: "800 90px Outfit, Open Sans, sans-serif",
    fontTimeSub: "700 18px Outfit, Open Sans, sans-serif",
    fontStatValue: "700 26px Outfit, Open Sans, sans-serif",
    fontStatLabel: "600 10px Outfit, Open Sans, sans-serif",
    fontHistoryHeader: "800 10px Outfit, Open Sans, sans-serif",
    fontHistoryLabel: "600 11px Outfit, Open Sans, sans-serif",
    fontHistorySubline: "700 9px Outfit, Open Sans, sans-serif"
};
