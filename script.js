// ==========================================
// 1. GLOBAL STATE & STATS DATA
// ==========================================
let allStats = {};
let allUsers = [];

let currentCardState = {
    name: '',
    time: 0,
    count: 0,
    pages: 0,
    chars: 0,
    sources: 0,
    themeName: '',
    history: []
};

// Customizer state toggles & cache settings
let isContextMenuOpen = false;
let currentSortMode = 'chrono';
let excludedMarathons = new Set();
let lastRenderedUser = '';
let lastRenderedRange = '';
let lastRenderedSort = '';
let userMarathonsOrder = [];
let activeUserForOrder = '';
let forceCheckboxRebuild = false;

// History metrics customizations
let userMetricsOrder = ['time', 'pages', 'chars', 'sources'];
let enabledMetrics = new Set(['time']);
let lastRenderedMetrics = '';

// Active selections & chart cache
let historyChart = null;
let currentMetric = 'time';
let currentRange = 'all';
let currentQuery = '';

// ==========================================
// 2. CONFIGURATION & LAYOUT PARAMETERS
// ==========================================
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
    '#ff00aa', // WK Pink
    '#00aaff', // WK Blue
    '#a100ff', // WK Purple
    '#ff5f00', // Sunset
    '#00d47e', // Emerald
    '#ffb800'  // Golden
];
let currentAccentColor = accentColors[0];

/**
 * Layout configuration constants for the summary card canvas.
 * Dimensions are based on the logical drawing scale (800x400).
 */
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

// ==========================================
// 3. DOM ELEMENT REFERENCES
// ==========================================
const usernameInput = document.getElementById('usernameInput');
const userList = document.getElementById('userList');
const resultsContainer = document.getElementById('results');
const chartSection = document.getElementById('chart-section');
const summarySection = document.getElementById('summary-section');
const chartTabs = document.querySelectorAll('.chart-tab');
const rangeBtns = document.querySelectorAll('.range-toggle .toggle-btn');
const downloadBtn = document.getElementById('downloadBtn');

// ==========================================
// 4. UTILITY HELPERS
// ==========================================

/**
 * Parses a standard marathon time string (HH:MM:SS) or decimal into a float of hours.
 * @param {string|number} timeStr - Time reported by user.
 * @returns {number} Hours represented as a decimal.
 */
function parseTimeToHours(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        const s = parseInt(parts[2]) || 0;
        return h + (m / 60) + (s / 3600);
    }
    return parseFloat(timeStr) || 0;
}

/**
 * Formats a decimal hour number into a human-readable "Xh Ym" string.
 * @param {number} time - Time in hours.
 * @returns {string} Formatted duration.
 */
function formatHours(time) {
    const totalMinutes = Math.round(time * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
}

/**
 * Converts an RGB color string to hex format.
 * @param {string} rgb - RGB CSS value.
 * @returns {string} Hex representation.
 */
function rgbToHex(rgb) {
    if (!rgb) return '';
    const m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!m) return rgb;
    return '#' + [1, 2, 3].map(i => parseInt(m[i]).toString(16).padStart(2, '0')).join('');
}

/**
 * Returns a promise that resolves once the current background GIF loaded successfully.
 * @returns {Promise<void>}
 */
function ensureBgLoaded() {
    if (!bgLoadPromise) return Promise.resolve();
    return bgLoadPromise;
}

/**
 * Calculates the dynamic sidebar header label based on included and excluded marathons.
 * @param {string[]} participatedMarathons - All marathons the user participated in.
 * @param {Set<string>} excludedMarathons - Currently excluded marathons.
 * @returns {string} The formatted header label (e.g. "ALL TIME", "PAST YEAR", "YEAR 2024", "MANUAL").
 */
function getSidebarHeaderLabel(participatedMarathons, excludedMarathons) {
    const included = participatedMarathons.filter(m => !excludedMarathons.has(m));
    if (included.length === 0) {
        return "NONE";
    }

    const isAllSelected = participatedMarathons.every(m => !excludedMarathons.has(m));
    if (isAllSelected) {
        return "ALL TIME";
    }

    // Get sorted list of all marathons in the system to determine "past year" (most recent 4)
    const allNames = Object.keys(allStats).sort((a, b) => {
        const getVal = (s) => {
            const [season, year] = s.split(' ');
            const seasonScore = { 'Winter': 4, 'Fall': 3, 'Autumn': 3, 'Summer': 2, 'Spring': 1 }[season] || 0;
            return parseInt(year) * 10 + seasonScore;
        };
        return getVal(a) - getVal(b);
    });
    const last4Marathons = allNames.slice(-4);
    
    const isPastYear = included.length === last4Marathons.length &&
                       included.every(m => last4Marathons.includes(m));
    if (isPastYear) {
        return "PAST YEAR";
    }

    // Check if all included marathons share the same calendar year
    const years = included.map(m => {
        const parts = m.split(' ');
        return parts[parts.length - 1];
    });
    const uniqueYears = [...new Set(years)];
    if (uniqueYears.length === 1) {
        return `YEAR ${uniqueYears[0]}`;
    }

    return "MANUAL";
}

// ==========================================
// 5. STATE SETTERS & ACTION HANDLERS
// ==========================================

/**
 * Updates the active theme background GIF, loads it via gifler, and updates season colors.
 * @param {string} gif - Filename of the target GIF background.
 */
function setBackground(gif) {
    currentBg = gif;
    
    bgLoadPromise = new Promise((resolve) => {
        // Load the GIF in the background first to avoid immediate black flicker
        gifler(gif).get(a => {
            if (currentBg === gif) {
                const oldCanvas = document.getElementById('bgGifCanvas');
                if (oldCanvas) {
                    const newCanvas = document.createElement('canvas');
                    newCanvas.id = 'bgGifCanvas';
                    newCanvas.className = 'bg-gif';
                    oldCanvas.replaceWith(newCanvas);
                    
                    a.onDrawFrame = (ctx, frame) => {
                        ctx.drawImage(frame.buffer, frame.x, frame.y);
                        triggerCardRedraw();
                    };
                    a.animateInCanvas(newCanvas);
                }
                resolve();
            } else {
                resolve();
            }
        });
    });

    document.querySelectorAll('.bg-btn').forEach(btn => {
        const btnGif = btn.dataset.gif;
        btn.classList.toggle('active', btnGif === gif);
    });

    // Automatically set corresponding season color
    let foundColor = null;
    const lowerGif = gif.toLowerCase();
    if (lowerGif.startsWith('spring')) foundColor = '#ff00aa';
    else if (lowerGif.startsWith('summer')) foundColor = '#ffb800';
    else if (lowerGif.startsWith('winter')) foundColor = '#00aaff';
    else if (lowerGif.startsWith('fall') || lowerGif.startsWith('autumn')) foundColor = '#ff5f00';

    if (foundColor) {
        setAccentColor(foundColor);
    } else {
        if (!currentQuery) {
            updateSummaryCard();
        }
    }
}

/**
 * Updates the global accent color and propagates changes across UI pickers, charts, and canvas.
 * @param {string} color - Hex color code.
 */
function setAccentColor(color) {
    currentAccentColor = color;
    document.documentElement.style.setProperty('--accent-color', color);
    document.querySelectorAll('.color-pill').forEach(pill => {
        pill.classList.toggle('active', pill.style.backgroundColor === color ||
            rgbToHex(pill.style.backgroundColor) === color);
    });

    updateSummaryCard();
    updateChart();
    if (currentQuery) {
        renderResults(currentQuery);
    }
}

/**
 * Sets the active custom history list sorting mode.
 * @param {string} mode - Sorting type ('chrono', 'metric', 'manual').
 */
function setSortMode(mode) {
    currentSortMode = mode;
    const sortBtns = document.querySelectorAll('.sort-toggle .toggle-btn');
    sortBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === mode);
    });
    updateSummaryCard();
}

/**
 * Formats a search query string, resets parameters, and triggers a full UI render refresh.
 */
function handleSearch() {
    const query = usernameInput.value.trim().toLowerCase();

    if (!query) {
        resultsContainer.innerHTML = '';
        currentQuery = '';
        excludedMarathons.clear();
        userMarathonsOrder = [];
        lastRenderedUser = '';
        lastRenderedRange = '';
        lastRenderedSort = '';
        activeUserForOrder = '';
        updateSummaryCard();
        updateChart();
        return;
    }

    if (currentQuery !== query) {
        excludedMarathons.clear();
        userMarathonsOrder = [];
    }

    currentQuery = query;
    renderResults(query);
    updateChart();
    updateSummaryCard();
}

/**
 * Returns the sorted chronological order of all marathons.
 * @returns {string[]} Marathon names.
 */
function getMarathonOrder() {
    return Object.keys(allStats).sort((a, b) => {
        const getVal = (s) => {
            const [season, year] = s.split(' ');
            const seasonScore = { 'Winter': 4, 'Fall': 3, 'Autumn': 3, 'Summer': 2, 'Spring': 1 }[season] || 0;
            return parseInt(year) * 10 + seasonScore;
        };
        return getVal(a) - getVal(b); // Chronological
    });
}

// ==========================================
// 6. DOM UI BUILDERS
// ==========================================

/**
 * Re-renders the metrics checklist UI pills under the settings panel.
 */
function updateMetricCheckboxes() {
    const container = document.getElementById('metricCheckboxes');
    if (!container) return;

    // Cache key combination of order and enabled states
    const cacheKey = userMetricsOrder.join(',') + '|' + Array.from(enabledMetrics).sort().join(',');
    if (lastRenderedMetrics === cacheKey) {
        return;
    }
    lastRenderedMetrics = cacheKey;

    container.innerHTML = '';

    userMetricsOrder.forEach((metric) => {
        const label = document.createElement('label');
        label.className = 'checkbox-pill-label';
        if (!enabledMetrics.has(metric)) {
            label.classList.add('excluded');
        }

        const pillContent = document.createElement('div');
        pillContent.className = 'checkbox-pill-content';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = enabledMetrics.has(metric);
        checkbox.onchange = () => {
            if (checkbox.checked) {
                enabledMetrics.add(metric);
                label.classList.remove('excluded');
            } else {
                enabledMetrics.delete(metric);
                label.classList.add('excluded');
            }



            updateSummaryCard();
        };

        const labelText = document.createElement('span');
        labelText.className = 'pill-text';
        
        const metricNames = {
            time: 'Time',
            pages: 'Pages',
            chars: 'Chars',
            sources: 'Sources'
        };
        labelText.textContent = metricNames[metric] || metric;

        pillContent.appendChild(checkbox);
        pillContent.appendChild(labelText);
        label.appendChild(pillContent);

        const arrowsSpan = document.createElement('span');
        arrowsSpan.className = 'sort-arrows';

        const upBtn = document.createElement('button');
        upBtn.className = 'arrow-btn';
        upBtn.textContent = '▲';
        upBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const mainIndex = userMetricsOrder.indexOf(metric);
            if (mainIndex > 0) {
                const temp = userMetricsOrder[mainIndex];
                userMetricsOrder[mainIndex] = userMetricsOrder[mainIndex - 1];
                userMetricsOrder[mainIndex - 1] = temp;
                updateMetricCheckboxes();
                updateSummaryCard();
            }
        };

        const downBtn = document.createElement('button');
        downBtn.className = 'arrow-btn';
        downBtn.textContent = '▼';
        downBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const mainIndex = userMetricsOrder.indexOf(metric);
            if (mainIndex < userMetricsOrder.length - 1) {
                const temp = userMetricsOrder[mainIndex];
                userMetricsOrder[mainIndex] = userMetricsOrder[mainIndex + 1];
                userMetricsOrder[mainIndex + 1] = temp;
                updateMetricCheckboxes();
                updateSummaryCard();
            }
        };

        arrowsSpan.appendChild(upBtn);
        arrowsSpan.appendChild(downBtn);
        label.appendChild(arrowsSpan);

        container.appendChild(label);
    });
}

/**
 * Re-renders the marathon checklist UI pills under the settings panel.
 * @param {string[]} userMarathons - Marathons the searched user participated in.
 */
function updateMarathonCheckboxes(userMarathons) {
    const container = document.getElementById('marathonCheckboxes');
    if (!container) return;

    const cacheKeyUser = currentQuery;
    const cacheKeyRange = currentRange;
    const cacheKeySort = currentSortMode;

    // Only rebuild DOM if the user, range, or sort mode changed, or if explicitly forced
    if (!forceCheckboxRebuild && 
        lastRenderedUser === cacheKeyUser && 
        lastRenderedRange === cacheKeyRange &&
        lastRenderedSort === cacheKeySort) {
        return;
    }

    forceCheckboxRebuild = false; // Reset the force flag
    lastRenderedUser = cacheKeyUser;
    lastRenderedRange = cacheKeyRange;
    lastRenderedSort = cacheKeySort;

    container.innerHTML = '';
    
    const activeSet = new Set(userMarathons);
    let visibleMarathons = userMarathonsOrder.filter(name => activeSet.has(name));

    // Sort visible checklist pills depending on sort mode
    if (currentSortMode === 'chrono') {
        const getVal = (s) => {
            const [season, year] = s.split(' ');
            const seasonScore = { 'Winter': 4, 'Fall': 3, 'Autumn': 3, 'Summer': 2, 'Spring': 1 }[season] || 0;
            return parseInt(year) * 10 + seasonScore;
        };
        visibleMarathons.sort((a, b) => getVal(a) - getVal(b));
    } else if (currentSortMode === 'metric') {
        const firstActiveMetric = userMetricsOrder.find(m => enabledMetrics.has(m));
        visibleMarathons.sort((a, b) => {
            const entryA = allStats[a]?.find(e => e.user.toLowerCase() === currentQuery);
            const entryB = allStats[b]?.find(e => e.user.toLowerCase() === currentQuery);
            
            let valA = 0;
            let valB = 0;
            
            if (firstActiveMetric === 'time') {
                valA = entryA ? parseTimeToHours(entryA.time) : 0;
                valB = entryB ? parseTimeToHours(entryB.time) : 0;
            } else if (firstActiveMetric === 'pages') {
                valA = entryA ? (parseInt(entryA.pages) || 0) : 0;
                valB = entryB ? (parseInt(entryB.pages) || 0) : 0;
            } else if (firstActiveMetric === 'chars') {
                valA = entryA ? (parseInt(entryA.characters) || 0) : 0;
                valB = entryB ? (parseInt(entryB.characters) || 0) : 0;
            } else if (firstActiveMetric === 'sources') {
                valA = entryA ? (parseInt(entryA.sources) || 0) : 0;
                valB = entryB ? (parseInt(entryB.sources) || 0) : 0;
            }
            
            return valB - valA;
        });
    }

    visibleMarathons.forEach((name) => {
        const label = document.createElement('label');
        label.className = 'checkbox-pill-label';
        if (excludedMarathons.has(name)) {
            label.classList.add('excluded');
        }
        
        const pillContent = document.createElement('div');
        pillContent.className = 'checkbox-pill-content';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !excludedMarathons.has(name);
        checkbox.onchange = () => {
            if (checkbox.checked) {
                excludedMarathons.delete(name);
                label.classList.remove('excluded');
            } else {
                excludedMarathons.add(name);
                label.classList.add('excluded');
            }
            updateSummaryCard();
        };

        const labelText = document.createElement('span');
        labelText.className = 'pill-text';
        const season = name.split(' ')[0];
        const emoji = seasonEmojis[season] || '';
        labelText.textContent = ` ${emoji} ${name}`;

        pillContent.appendChild(checkbox);
        pillContent.appendChild(labelText);
        label.appendChild(pillContent);

        const arrowsSpan = document.createElement('span');
        arrowsSpan.className = 'sort-arrows';

        const upBtn = document.createElement('button');
        upBtn.className = 'arrow-btn';
        upBtn.textContent = '▲';
        upBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (currentSortMode !== 'manual') {
                userMarathonsOrder = [...visibleMarathons];
            }
            
            const mainIndex = userMarathonsOrder.indexOf(name);
            if (mainIndex > 0) {
                const temp = userMarathonsOrder[mainIndex];
                userMarathonsOrder[mainIndex] = userMarathonsOrder[mainIndex - 1];
                userMarathonsOrder[mainIndex - 1] = temp;
                forceCheckboxRebuild = true;
                setSortMode('manual');
            }
        };

        const downBtn = document.createElement('button');
        downBtn.className = 'arrow-btn';
        downBtn.textContent = '▼';
        downBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (currentSortMode !== 'manual') {
                userMarathonsOrder = [...visibleMarathons];
            }
            
            const mainIndex = userMarathonsOrder.indexOf(name);
            if (mainIndex < userMarathonsOrder.length - 1) {
                const temp = userMarathonsOrder[mainIndex];
                userMarathonsOrder[mainIndex] = userMarathonsOrder[mainIndex + 1];
                userMarathonsOrder[mainIndex + 1] = temp;
                forceCheckboxRebuild = true;
                setSortMode('manual');
            }
        };

        arrowsSpan.appendChild(upBtn);
        arrowsSpan.appendChild(downBtn);
        label.appendChild(arrowsSpan);
        
        container.appendChild(label);
    });
}

/**
 * Builds the background theme selection buttons for the community view.
 * @param {string[]} allNames - Sorted list of all marathon names.
 */
function populateThemeButtons(allNames) {
    const bgButtonsContainer = document.getElementById('bgButtons');
    bgButtonsContainer.innerHTML = '';

    allNames.forEach(name => {
        const gifName = name.toLowerCase().replace(' ', '') + '.gif';
        if (gifBackgrounds.includes(gifName)) {
            const btn = document.createElement('button');
            btn.className = 'bg-btn';
            const season = name.split(' ')[0];
            const emoji = seasonEmojis[season] || '';
            btn.textContent = `${emoji} ${name}`;
            btn.dataset.gif = gifName;
            btn.classList.toggle('active', gifName === currentBg);
            btn.onclick = () => setBackground(gifName);
            bgButtonsContainer.appendChild(btn);
        }
    });
}

/**
 * Builds the background theme buttons for the user view.
 * Switches background theme if the current active GIF is not in the user's marathons.
 * @param {object[]} availableGifs - Array of name/gif maps the user has data for.
 */
function populateUserThemeButtons(availableGifs) {
    const bgButtonsContainer = document.getElementById('bgButtons');
    bgButtonsContainer.innerHTML = '';

    availableGifs.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'bg-btn';
        const season = item.name.split(' ')[0];
        const emoji = seasonEmojis[season] || '';
        btn.textContent = `${emoji} ${item.name}`;
        btn.dataset.gif = item.gif;
        btn.classList.toggle('active', item.gif === currentBg);
        btn.onclick = () => setBackground(item.gif);
        bgButtonsContainer.appendChild(btn);
    });

    if (availableGifs.length > 0) {
        if (!availableGifs.find(item => item.gif === currentBg)) {
            setBackground(availableGifs[availableGifs.length - 1].gif);
        }
    }
}

/**
 * Toggles the visibility of advanced customizer filters depending on user profile selection.
 * @param {boolean} hasData - If there is search data to filter.
 */
function toggleControlGroups(hasData) {
    const customizerCard = document.querySelector('.customizer-card');
    if (customizerCard) {
        customizerCard.style.display = hasData ? 'block' : 'none';
    }

    const optionsGroup = document.getElementById('optionsGroup');
    const sortGroup = document.getElementById('sortGroup');
    const filterGroup = document.getElementById('filterGroup');
    const metricsGroup = document.getElementById('metricsGroup');

    const displayStyle = hasData ? 'flex' : 'none';
    if (optionsGroup) optionsGroup.style.display = displayStyle;
    if (sortGroup) sortGroup.style.display = displayStyle;
    if (filterGroup) filterGroup.style.display = displayStyle;
    if (metricsGroup) metricsGroup.style.display = displayStyle;

    if (hasData) {
        updateMetricCheckboxes();
    }
}

// ==========================================
// 7. SUMMARY CARD CALCULATION FLOWS
// ==========================================

/**
 * Calculates community aggregate stats for the active background theme and draws the card.
 */
function calculateCommunityTotals() {
    // Use all marathons sorted chronologically to avoid range-filtering the active theme & buttons
    const allNames = Object.keys(allStats).sort((a, b) => {
        const getVal = (s) => {
            const [season, year] = s.split(' ');
            const seasonScore = { 'Winter': 4, 'Fall': 3, 'Autumn': 3, 'Summer': 2, 'Spring': 1 }[season] || 0;
            return parseInt(year) * 10 + seasonScore;
        };
        return getVal(a) - getVal(b);
    });

    let totalTime = 0, totalPages = 0, totalChars = 0, totalSources = 0, participatedCount = 0, userName = '';
    const participatedMarathons = [];

    const selectedMarathon = allNames.find(n => (n.toLowerCase().replace(' ', '') + '.gif') === currentBg);
    if (selectedMarathon) {
        const participants = allStats[selectedMarathon];
        userName = selectedMarathon;
        participatedCount = participants.length;
        participatedMarathons.push(selectedMarathon);

        participants.forEach(entry => {
            totalTime += parseTimeToHours(entry.time);
            totalPages += parseInt(entry.pages) || 0;
            totalChars += parseInt(entry.characters) || 0;
            totalSources += parseInt(entry.sources) || 0;
        });
    }

    summarySection.style.display = 'flex';
    populateThemeButtons(allNames);

    const customizerCard = document.querySelector('.customizer-card');
    if (customizerCard) customizerCard.style.display = 'none';

    drawCanvas(userName, totalTime, participatedCount, totalPages, totalChars, totalSources, false, selectedMarathon || '', participatedMarathons);
}

/**
 * Calculates user aggregate stats across active range marathons and updates checklists.
 * @param {string[]} marathonNames - Range-sliced marathon names list.
 */
function calculateUserTotals(marathonNames) {
    let totalTime = 0, totalPages = 0, totalChars = 0, totalSources = 0, participatedCount = 0;
    const userName = allUsers.find(u => u.toLowerCase() === currentQuery) || currentQuery;
    const participatedMarathons = [];

    // Initialize userMarathonsOrder if it's empty or for a different user
    if (activeUserForOrder !== currentQuery) {
        activeUserForOrder = currentQuery;
        const allNames = Object.keys(allStats).sort((a, b) => {
            const getVal = (s) => {
                const [season, year] = s.split(' ');
                const seasonScore = { 'Winter': 4, 'Fall': 3, 'Autumn': 3, 'Summer': 2, 'Spring': 1 }[season] || 0;
                return parseInt(year) * 10 + seasonScore;
            };
            return getVal(a) - getVal(b);
        });
        
        userMarathonsOrder = [];
        allNames.forEach(name => {
            const entry = allStats[name].find(e => e.user.toLowerCase() === currentQuery);
            if (entry) {
                userMarathonsOrder.push(name);
            }
        });
    }

    const filterTotals = document.getElementById('filterTotalsToggle')?.checked;

    marathonNames.forEach(name => {
        const entry = allStats[name].find(e => e.user.toLowerCase() === currentQuery);
        if (entry) {
            participatedMarathons.push(name);
            const isExcluded = excludedMarathons.has(name);
            
            if (!filterTotals || !isExcluded) {
                participatedCount++;
                totalTime += parseTimeToHours(entry.time);
                totalPages += parseInt(entry.pages) || 0;
                totalChars += parseInt(entry.characters) || 0;
                totalSources += parseInt(entry.sources) || 0;
            }
        }
    });

    updateMarathonCheckboxes(participatedMarathons);
    toggleControlGroups(participatedMarathons.length > 0);

    const includedMarathons = participatedMarathons.filter(name => !excludedMarathons.has(name));

    if (participatedMarathons.length > 0) {
        summarySection.style.display = 'flex';
        
        const availableGifs = [];
        marathonNames.forEach(name => {
            const users = allStats[name];
            if (users.find(e => e.user.toLowerCase() === currentQuery)) {
                const gifName = name.toLowerCase().replace(' ', '') + '.gif';
                if (gifBackgrounds.includes(gifName)) {
                    availableGifs.push({ name, gif: gifName });
                }
            }
        });

        populateUserThemeButtons(availableGifs);

        const currentBgItem = availableGifs.find(g => g.gif === currentBg);
        const label = currentBgItem ? currentBgItem.name : '';

        drawCanvas(userName, totalTime, participatedCount, totalPages, totalChars, totalSources, false, label, includedMarathons);
    } else {
        summarySection.style.display = 'none';
    }
}

/**
 * Main coordinator function that updates totals, filters, and rendering.
 */
function updateSummaryCard() {
    const marathonNames = getMarathonOrder();

    if (!currentQuery) {
        calculateCommunityTotals();
    } else {
        calculateUserTotals(marathonNames);
    }
}

// ==========================================
// 8. CANVAS RENDERING ENGINE
// ==========================================

/**
 * Fits and draws the active GIF frame from the offscreen canvas onto the main canvas.
 * @param {CanvasRenderingContext2D} ctx - Main canvas context.
 * @param {HTMLCanvasElement} bgImg - Offscreen canvas backing the animated GIF frame.
 */
function drawCanvasBackground(ctx, bgImg) {
    if (bgImg && bgImg.width > 0) {
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = CANVAS_LAYOUT.width / CANVAS_LAYOUT.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
            drawHeight = CANVAS_LAYOUT.height;
            drawWidth = bgImg.width * (CANVAS_LAYOUT.height / bgImg.height);
            offsetX = (CANVAS_LAYOUT.width - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = CANVAS_LAYOUT.width;
            drawHeight = bgImg.height * (CANVAS_LAYOUT.width / bgImg.width);
            offsetX = 0;
            offsetY = (CANVAS_LAYOUT.height - drawHeight) / 2;
        }

        ctx.drawImage(bgImg, Math.round(offsetX), Math.round(offsetY), Math.round(drawWidth), Math.round(drawHeight));
    }
}

/**
 * Applies the linear gradient dark overlay for contrast on the right sidebar.
 * @param {CanvasRenderingContext2D} ctx - Main canvas context.
 */
function drawCanvasOverlay(ctx) {
    const grad = ctx.createLinearGradient(0, 0, CANVAS_LAYOUT.width, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_LAYOUT.width, CANVAS_LAYOUT.height);
}

/**
 * Draws the thick color border frame.
 * @param {CanvasRenderingContext2D} ctx - Main canvas context.
 * @param {string} accentColor - Active hex styling color.
 */
function drawCanvasBorder(ctx, accentColor) {
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = CANVAS_LAYOUT.borderWidth;
    ctx.strokeRect(
        CANVAS_LAYOUT.borderInset,
        CANVAS_LAYOUT.borderInset,
        CANVAS_LAYOUT.width - (CANVAS_LAYOUT.borderInset * 2),
        CANVAS_LAYOUT.height - (CANVAS_LAYOUT.borderInset * 2)
    );
}

/**
 * Renders the username, WaniKani tagline, and large Time display.
 * @param {CanvasRenderingContext2D} ctx - Main canvas context.
 * @param {string} name - Searched username or active marathon season label.
 * @param {number} time - Total hours decimal.
 * @param {string} accentColor - Hex color code.
 */
function drawCanvasMainDetails(ctx, name, time, accentColor) {
    // Username and Tagline (Top Left)
    ctx.textAlign = 'left';
    ctx.font = CANVAS_LAYOUT.fontTitle;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name.toUpperCase(), CANVAS_LAYOUT.leftX, 85);

    ctx.font = CANVAS_LAYOUT.fontTagline;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('WaniKani Reading Marathon', CANVAS_LAYOUT.leftX, 110);

    // Big Total Time (Center)
    ctx.textAlign = 'center';
    ctx.shadowBlur = 15;
    ctx.font = CANVAS_LAYOUT.fontTimeBig;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(formatHours(time), CANVAS_LAYOUT.width / 2, 220);

    ctx.shadowBlur = 5;
    ctx.font = CANVAS_LAYOUT.fontTimeSub;
    ctx.fillStyle = accentColor;
    ctx.fillText('TOTAL TIME READ', CANVAS_LAYOUT.width / 2, 250);
}

/**
 * Renders the bottom statistical cards (Marathons/Participants, Pages, Chars, Sources).
 * @param {CanvasRenderingContext2D} ctx - Main canvas context.
 * @param {number} count - Numeric counts (marathons count for user, or participants for community).
 * @param {number} pages - Total pages read.
 * @param {number} chars - Total characters read.
 * @param {number} sources - Total sources read.
 */
function drawCanvasStatsRow(ctx, count, pages, chars, sources) {
    const pagesStr = pages > 0 ? pages.toLocaleString() : '–';
    const charsStr = chars > 0 ? chars.toLocaleString() : '–';

    const stats = [
        { label: currentQuery ? 'MARATHONS' : 'PARTICIPANTS', value: count },
        { label: 'PAGES', value: pagesStr },
        { label: 'CHARS', value: charsStr },
        { label: 'SOURCES', value: sources }
    ];

    const spacing = CANVAS_LAYOUT.width / 5;
    stats.forEach((s, i) => {
        const x = spacing * (i + 1);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.font = CANVAS_LAYOUT.fontStatValue;
        ctx.fillText(s.value, x, CANVAS_LAYOUT.statY);
        
        ctx.shadowBlur = 2;
        ctx.font = CANVAS_LAYOUT.fontStatLabel;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText(s.label, x, CANVAS_LAYOUT.statY + 18);
    });
}

/**
 * Sorts the user's history list according to the currentSortMode (chrono, metric, or manual).
 * @param {string[]} history - Marathon names to sort.
 * @returns {string[]} Sorted marathon names list.
 */
function sortHistoryData(history) {
    const renderedHistory = [...history];
    const firstActiveMetric = userMetricsOrder.find(m => enabledMetrics.has(m));

    if (currentSortMode === 'metric' && firstActiveMetric) {
        renderedHistory.sort((a, b) => {
            const entryA = allStats[a]?.find(e => e.user.toLowerCase() === currentQuery);
            const entryB = allStats[b]?.find(e => e.user.toLowerCase() === currentQuery);
            let valA = 0, valB = 0;

            if (firstActiveMetric === 'time') {
                valA = entryA ? parseTimeToHours(entryA.time) : 0;
                valB = entryB ? parseTimeToHours(entryB.time) : 0;
            } else if (firstActiveMetric === 'pages') {
                valA = entryA ? (parseInt(entryA.pages) || 0) : 0;
                valB = entryB ? (parseInt(entryB.pages) || 0) : 0;
            } else if (firstActiveMetric === 'chars') {
                valA = entryA ? (parseInt(entryA.characters) || 0) : 0;
                valB = entryB ? (parseInt(entryB.characters) || 0) : 0;
            } else if (firstActiveMetric === 'sources') {
                valA = entryA ? (parseInt(entryA.sources) || 0) : 0;
                valB = entryB ? (parseInt(entryB.sources) || 0) : 0;
            }
            return valB - valA;
        });
    } else if (currentSortMode === 'manual') {
        renderedHistory.sort((a, b) => {
            return userMarathonsOrder.indexOf(a) - userMarathonsOrder.indexOf(b);
        });
    }
    return renderedHistory;
}

/**
 * Builds the array of formatted statistic parts for the history subline.
 * @param {string} marathonName - Name of the marathon.
 * @returns {string[]} Formatted metric fragments.
 */
function buildMetricsSubline(marathonName) {
    const subLineParts = [];
    userMetricsOrder.forEach(metric => {
        if (enabledMetrics.has(metric)) {
            const entry = allStats[marathonName]?.find(e => e.user.toLowerCase() === currentQuery);
            if (entry) {
                if (metric === 'time' && entry.time) {
                    subLineParts.push(formatHours(parseTimeToHours(entry.time)));
                } else if (metric === 'pages' && entry.pages) {
                    subLineParts.push(`${parseInt(entry.pages).toLocaleString()} pgs`);
                } else if (metric === 'chars' && entry.characters) {
                    const charVal = parseInt(entry.characters) || 0;
                    const charStr = charVal >= 1000 
                        ? (charVal / 1000).toFixed(charVal % 1000 === 0 ? 0 : 1) + 'k'
                        : charVal.toString();
                    subLineParts.push(`${charStr} chars`);
                } else if (metric === 'sources' && entry.sources) {
                    subLineParts.push(`${parseInt(entry.sources)} src`);
                }
            }
        }
    });
    return subLineParts;
}

/**
 * Renders the right column history panel when showHistory is active.
 * @param {CanvasRenderingContext2D} ctx - Main canvas context.
 * @param {string[]} history - Marathon names the user participated in.
 * @param {string} accentColor - Active hex styling color.
 * @param {boolean} showHistory - Visibility toggle check state.
 */
function drawCanvasHistorySidebar(ctx, history, accentColor, showHistory) {
    if (showHistory && history.length > 0 && currentQuery) {
        ctx.textAlign = 'right';
        ctx.shadowBlur = 0;
        let yStart = CANVAS_LAYOUT.historyYStart;

        // Calculate the dynamic header label based on selection
        const userMarathons = [];
        const allNames = getMarathonOrder();
        allNames.forEach(n => {
            const e = allStats[n]?.find(x => x.user.toLowerCase() === currentQuery);
            if (e) {
                userMarathons.push(n);
            }
        });
        const headerLabel = getSidebarHeaderLabel(userMarathons, excludedMarathons);

        // Draw header
        ctx.font = CANVAS_LAYOUT.fontHistoryHeader;
        ctx.fillStyle = accentColor;
        ctx.fillText(headerLabel, CANVAS_LAYOUT.rightX, yStart);
        yStart += 18;

        const hasMetricsEnabled = userMetricsOrder.some(m => enabledMetrics.has(m));
        const lineHeight = hasMetricsEnabled ? 24 : 16;

        const renderedHistory = sortHistoryData(history);
        const limit = hasMetricsEnabled ? 10 : 15;
        const isTruncated = renderedHistory.length > limit;
        
        const displayHistory = (isTruncated && currentSortMode === 'chrono')
            ? renderedHistory.slice(-limit)
            : renderedHistory.slice(0, limit);

        let currentY = yStart;

        displayHistory.forEach((hItem) => {
            const [season, year] = hItem.split(' ');
            const emoji = seasonEmojis[season] || '';
            const shortYear = year.slice(-2);

            // Marathon label text
            const labelText = `${season.substring(0, 3).toUpperCase()} '${shortYear}`;
            ctx.font = CANVAS_LAYOUT.fontHistoryLabel;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(labelText, CANVAS_LAYOUT.rightX, currentY);

            // Render emoji to the left of the label to prevent mobile alignment offsets
            const textWidth = ctx.measureText(labelText).width;
            ctx.textAlign = 'left';
            ctx.fillText(emoji, CANVAS_LAYOUT.rightX - textWidth - 18, currentY);
            ctx.textAlign = 'right';

            // Metrics subline (e.g. "8h 40m • 120 pgs • 12k chars • 2 src")
            const subLineParts = buildMetricsSubline(hItem);
            if (subLineParts.length > 0) {
                const subLineText = subLineParts.join(' • ');
                ctx.font = CANVAS_LAYOUT.fontHistorySubline;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fillText(subLineText, CANVAS_LAYOUT.rightX, currentY + 11);
            }

            currentY += lineHeight;
        });

        if (isTruncated) {
            ctx.font = CANVAS_LAYOUT.fontHistoryLabel;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillText('...', CANVAS_LAYOUT.rightX, currentY);
        }
    }
}

/**
 * Draws all visual components of the achievements card onto the canvas.
 * Handles the 2x scale mapping for crisp rendering and exports.
 */
function drawCanvas(name, time, count, pages, chars, sources, forExport = false, themeName = '', history = []) {
    if (!forExport) {
        currentCardState = { name, time, count, pages, chars, sources, themeName, history };
    }
    const canvas = document.getElementById('summaryCardCanvas');
    const ctx = canvas.getContext('2d');
    
    // Reset context and paint background fallback
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#232323';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(2, 2); // Apply High-DPI scale multiplier

    // Fit & scale offscreen canvas background GIF
    const bgImg = document.getElementById('bgGifCanvas');
    drawCanvasBackground(ctx, bgImg);

    // Apply linear gradient overlay for sidebar contrast
    drawCanvasOverlay(ctx);

    // Draw card borders
    drawCanvasBorder(ctx, currentAccentColor);

    // Draw main label titles
    drawCanvasMainDetails(ctx, name, time, currentAccentColor);

    // Draw values stats row
    drawCanvasStatsRow(ctx, count, pages, chars, sources);

    // Draw right sidebar history details
    const showHistoryToggle = document.getElementById('showHistoryToggle');
    const showHistory = showHistoryToggle ? showHistoryToggle.checked : true;
    drawCanvasHistorySidebar(ctx, history, currentAccentColor, showHistory);

    ctx.restore();
}

/**
 * Force redraws the main canvas using cached state parameter values.
 */
function triggerCardRedraw() {
    if (!currentCardState || !currentCardState.name) return;
    drawCanvas(
        currentCardState.name,
        currentCardState.time,
        currentCardState.count,
        currentCardState.pages,
        currentCardState.chars,
        currentCardState.sources,
        false,
        currentCardState.themeName,
        currentCardState.history
    );
}

// ==========================================
// 9. EXPORTS & CLIPBOARD LOGIC
// ==========================================

/**
 * Triggers a browser file download of the compiled PNG achievement card.
 */
async function downloadCanvas() {
    const names = getMarathonOrder();
    let tTime = 0, tPages = 0, tChars = 0, tSources = 0, count = 0, uName = '';
    const participatedMarathons = [];

    if (!currentQuery) {
        // Community view: aggregate stats for the selected marathon
        const selectedMarathon = names.find(n => (n.toLowerCase().replace(' ', '') + '.gif') === currentBg);
        if (selectedMarathon) {
            const participants = allStats[selectedMarathon];
            uName = selectedMarathon;
            count = participants.length;
            participatedMarathons.push(selectedMarathon);

            participants.forEach(entry => {
                tTime += parseTimeToHours(entry.time);
                tPages += parseInt(entry.pages) || 0;
                tChars += parseInt(entry.characters) || 0;
                tSources += parseInt(entry.sources) || 0;
            });
        }
    } else {
        // User view: aggregate stats for the searched user
        names.forEach(n => {
            const e = allStats[n].find(x => x.user.toLowerCase() === currentQuery);
            if (e) {
                uName = e.user;
                count++;
                participatedMarathons.push(n);
                tTime += parseTimeToHours(e.time);
                tPages += parseInt(e.pages) || 0;
                tChars += parseInt(e.characters) || 0;
                tSources += parseInt(e.sources) || 0;
            }
        });
    }

    const bgItem = gifBackgrounds.find(g => g === currentBg);
    const label = bgItem ? bgItem.replace('.gif', '').replace(/([a-z]+)(\d+)/i, (m, s, y) => s.charAt(0).toUpperCase() + s.slice(1) + ' ' + y) : '';

    await ensureBgLoaded();
    const canvas = document.getElementById('summaryCardCanvas');
    const link = document.createElement('a');
    link.download = `${currentQuery || 'community'}_achievement.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

/**
 * Copies the PNG compiled achievements card into the user's clipboard buffer.
 */
async function copyCanvas() {
    const names = getMarathonOrder();
    let tTime = 0, tPages = 0, tChars = 0, tSources = 0, count = 0, uName = '';
    const participatedMarathons = [];

    if (!currentQuery) {
        const selectedMarathon = names.find(n => (n.toLowerCase().replace(' ', '') + '.gif') === currentBg);
        if (selectedMarathon) {
            const participants = allStats[selectedMarathon];
            uName = selectedMarathon;
            count = participants.length;
            participatedMarathons.push(selectedMarathon);
            participants.forEach(entry => {
                tTime += parseTimeToHours(entry.time);
                tPages += parseInt(entry.pages) || 0;
                tChars += parseInt(entry.characters) || 0;
                tSources += parseInt(entry.sources) || 0;
            });
        }
    } else {
        names.forEach(n => {
            const e = allStats[n].find(x => x.user.toLowerCase() === currentQuery);
            if (e) {
                uName = e.user;
                count++;
                participatedMarathons.push(n);
                tTime += parseTimeToHours(e.time);
                tPages += parseInt(e.pages) || 0;
                tChars += parseInt(e.characters) || 0;
                tSources += parseInt(e.sources) || 0;
            }
        });
    }

    const bgItem = gifBackgrounds.find(g => g === currentBg);
    const label = bgItem ? bgItem.replace('.gif', '').replace(/([a-z]+)(\d+)/i, (m, s, y) => s.charAt(0).toUpperCase() + s.slice(1) + ' ' + y) : '';

    await ensureBgLoaded();
    const canvas = document.getElementById('summaryCardCanvas');

    try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy image. Try downloading instead.');
    }
}

// ==========================================
// 10. GRAPH & LEADERBOARD RENDERING
// ==========================================

/**
 * Populates individual results card pills below the summary section.
 * @param {string} query - Searched username query.
 */
function renderResults(query) {
    resultsContainer.innerHTML = '';
    let foundAny = false;
    const marathonOrders = getMarathonOrder().reverse();

    marathonOrders.forEach((mName) => {
        const entry = allStats[mName].find(e => e.user.toLowerCase() === query);
        if (entry) {
            foundAny = true;
            const card = createCard(mName, entry, currentAccentColor);
            resultsContainer.appendChild(card);
        }
    });
    if (!foundAny) {
        const suggestions = allUsers.filter(u => u.toLowerCase().includes(query)).slice(0, 5);
        if (suggestions.length > 0) {
            const box = document.createElement('div');
            box.className = 'suggestions-box';
            box.innerHTML = `<span>Did you mean?</span><div class="suggestion-pills">${suggestions.map(s => `<span class="suggestion-pill" onclick="selectUser('${s}')">${s}</span>`).join('')}</div>`;
            resultsContainer.appendChild(box);
        }
    }
}

/**
 * Creates individual marathon history card elements.
 * @param {string} title - Marathon season name.
 * @param {object} data - Individual statistics data.
 * @param {string} color - Hex accent color string.
 * @returns {HTMLDivElement} Compiled DOM card element.
 */
function createCard(title, data, color) {
    const card = document.createElement('div');
    card.className = 'card';
    const season = title.split(' ')[0], emoji = seasonEmojis[season] || '';
    const statsHtml = `
        <div class="stats-list">
            <div class="stat-item"><span class="stat-label">TIME</span><span class="stat-value">${data.time || '--'}</span></div>
            <div class="stat-item"><span class="stat-label">PAGES</span><span class="stat-value">${data.pages || '--'}</span></div>
            <div class="stat-item"><span class="stat-label">CHARACTERS</span><span class="stat-value">${data.characters ? data.characters.toLocaleString() : '--'}</span></div>
            <div class="stat-item"><span class="stat-label">SOURCES</span><span class="stat-value">${data.sources || '--'}</span></div>
        </div>`;
    const linkHtml = data.url ? `<a href="${data.url}" target="_blank" class="card-link" style="color: var(--wk-blue);">View Original Post →</a>` : '';

    card.innerHTML = `<div class="card-header" style="background-color: ${color};">
        <span class="marathon-name">${emoji} ${title}</span>
    </div>
    <div class="card-body">${statsHtml}${linkHtml}</div>`;
    return card;
}

/**
 * Re-draws the history line graph below the achievements card.
 * @param {string[]} labels - X-axis labels (marathon seasons).
 * @param {number[]} dataPoints - Y-axis data points.
 */
function renderChart(labels, dataPoints) {
    if (historyChart) historyChart.destroy();
    const ctx = document.getElementById('historyChart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: currentMetric.toUpperCase(),
                data: dataPoints,
                borderColor: currentAccentColor,
                backgroundColor: `${currentAccentColor}1a`, // Add 10% opacity (1a in hex)
                borderWidth: 3,
                tension: 0.3,
                pointBackgroundColor: currentAccentColor,
                pointRadius: 5,
                pointHitRadius: 15,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    title: { display: true, text: currentMetric.toUpperCase(), color: '#919191' }, 
                    ticks: { 
                        color: '#919191',
                        precision: 0,
                        callback: function(value) {
                            if (currentMetric === 'time') return Math.floor(value) + 'h';
                            return value.toLocaleString();
                        }
                    } 
                },
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: 'MARATHON', color: '#919191' }, ticks: { color: '#919191' } }
            },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let val = context.parsed.y;
                            if (currentMetric === 'time') {
                                return `Time: ${formatHours(val)}`;
                            } else if (currentMetric === 'characters') {
                                return `Characters: ${val.toLocaleString()}`;
                            } else if (currentMetric === 'pages') {
                                return `Pages: ${val.toLocaleString()}`;
                            } else if (currentMetric === 'sources') {
                                return `Sources: ${val.toLocaleString()}`;
                            } else if (currentMetric === 'participants') {
                                return `Participants: ${val.toLocaleString()}`;
                            }
                            return val;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Fetches current data points and triggers chart rendering.
 */
function updateChart() {
    const marathonNames = getMarathonOrder();
    const labels = [];
    const dataPoints = [];

    const participantsTab = document.querySelector('.chart-tab[data-metric="participants"]');
    if (participantsTab) {
        if (currentQuery) {
            participantsTab.style.display = 'none';
            if (currentMetric === 'participants') {
                currentMetric = 'time';
                const timeTab = document.querySelector('.chart-tab[data-metric="time"]');
                if (timeTab) {
                    document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
                    timeTab.classList.add('active');
                }
            }
        } else {
            participantsTab.style.display = 'inline-block';
        }
    }

    if (!currentQuery) {
        // Community totals chart
        marathonNames.forEach(name => {
            const entries = allStats[name];
            if (entries && entries.length > 0) {
                labels.push(name);
                if (currentMetric === 'participants') {
                    dataPoints.push(entries.length);
                } else {
                    let totalValue = 0;
                    entries.forEach(entry => {
                        let value = entry[currentMetric] || 0;
                        if (currentMetric === 'time') {
                            value = parseTimeToHours(value);
                        }
                        totalValue += parseFloat(value) || 0;
                    });
                    dataPoints.push(totalValue);
                }
            }
        });
    } else {
        // Individual user chart
        const filterTotals = document.getElementById('filterTotalsToggle')?.checked;
        marathonNames.forEach(name => {
            const entries = allStats[name];
            const entry = entries.find(e => e.user.toLowerCase() === currentQuery);

            if (entry) {
                if (filterTotals && excludedMarathons.has(name)) {
                    return;
                }

                labels.push(name);
                
                if (currentMetric === 'participants') {
                    dataPoints.push(1);
                } else {
                    let value = entry[currentMetric] || 0;

                    if (currentMetric === 'time') {
                        value = parseTimeToHours(value);
                    }
                    dataPoints.push(parseFloat(value) || 0);
                }
            }
        });
    }

    if (dataPoints.length > 0) {
        chartSection.style.display = 'block';
        renderChart(labels, dataPoints);
    } else {
        chartSection.style.display = 'none';
    }
}

// ==========================================
// 11. INITIALIZATION & LIFECYCLE
// ==========================================

/**
 * Main application entrypoint. Fetches JSON data, configures search bindings,
 * sets defaults, and initialises UI controls.
 */
async function init() {
    try {
        if (document.fonts) {
            await Promise.all([
                document.fonts.load("12px 'Outfit'"),
                document.fonts.load("12px 'Open Sans'")
            ]);
        }

        const statsRes = await fetch('all_stats.json');
        allStats = await statsRes.json();

        const usersRes = await fetch('users.json');
        allUsers = await usersRes.json();

        // Populate autocomplete datalist alphabetically
        allUsers.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).forEach(user => {
            const opt = document.createElement('option');
            opt.value = user;
            userList.appendChild(opt);
        });

        usernameInput.addEventListener('input', handleSearch);
        usernameInput.addEventListener('change', handleSearch);

        chartTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                chartTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentMetric = tab.dataset.metric;
                updateChart();
            });
        });

        const sortBtns = document.querySelectorAll('.sort-toggle .toggle-btn');
        sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setSortMode(btn.dataset.sort);
            });
        });

        downloadBtn.addEventListener('click', downloadCanvas);

        const copyBtn = document.getElementById('copyBtn');
        copyBtn.addEventListener('click', copyCanvas);

        // Info panel toggling
        const infoBtn = document.getElementById('infoBtn');
        const infoPanel = document.getElementById('infoPanel');
        infoBtn.addEventListener('click', () => {
            const isVisible = infoPanel.style.display === 'block';
            infoPanel.style.display = isVisible ? 'none' : 'block';
            infoBtn.textContent = isVisible ? 'What is this?' : 'Hide info';
        });

        // Collapsible Advanced Settings panel
        const customizerToggleBtn = document.getElementById('customizerToggleBtn');
        const customizerContent = document.getElementById('customizerContent');
        const customizerCard = document.querySelector('.customizer-card');
        if (customizerToggleBtn && customizerContent && customizerCard) {
            customizerToggleBtn.addEventListener('click', () => {
                const isExpanded = customizerCard.classList.toggle('expanded');
                customizerContent.style.display = isExpanded ? 'block' : 'none';
            });
        }

        // Toggle "show marathon history" checkbox behavior
        const showHistoryToggle = document.getElementById('showHistoryToggle');
        if (showHistoryToggle) {
            showHistoryToggle.addEventListener('change', () => {
                if (showHistoryToggle.checked && enabledMetrics.size === 0) {
                    enabledMetrics.add('time');
                    updateMetricCheckboxes();
                }
                if (currentQuery) {
                    updateSummaryCard();
                }
            });
        }

        // Toggle "filter totals by checklist" checkbox behavior
        const filterTotalsToggle = document.getElementById('filterTotalsToggle');
        if (filterTotalsToggle) {
            filterTotalsToggle.addEventListener('change', () => {
                updateSummaryCard();
                updateChart();
            });
        }

        // Quick select buttons behavior
        const quickSelectAll = document.getElementById('quickSelectAll');
        const quickSelectYear = document.getElementById('quickSelectYear');
        const quickSelectNone = document.getElementById('quickSelectNone');

        if (quickSelectAll) {
            quickSelectAll.addEventListener('click', (e) => {
                e.preventDefault();
                excludedMarathons.clear();
                forceCheckboxRebuild = true;
                updateSummaryCard();
                updateChart();
            });
        }
        if (quickSelectNone) {
            quickSelectNone.addEventListener('click', (e) => {
                e.preventDefault();
                userMarathonsOrder.forEach(m => excludedMarathons.add(m));
                forceCheckboxRebuild = true;
                updateSummaryCard();
                updateChart();
            });
        }
        if (quickSelectYear) {
            quickSelectYear.addEventListener('click', (e) => {
                e.preventDefault();
                const allNames = Object.keys(allStats).sort((a, b) => {
                    const getVal = (s) => {
                        const [season, year] = s.split(' ');
                        const seasonScore = { 'Winter': 4, 'Fall': 3, 'Autumn': 3, 'Summer': 2, 'Spring': 1 }[season] || 0;
                        return parseInt(year) * 10 + seasonScore;
                    };
                    return getVal(a) - getVal(b);
                });
                const lastYearMarathons = new Set(allNames.slice(-4));
                
                userMarathonsOrder.forEach(m => {
                    if (lastYearMarathons.has(m)) {
                        excludedMarathons.delete(m);
                    } else {
                        excludedMarathons.add(m);
                    }
                });
                forceCheckboxRebuild = true;
                updateSummaryCard();
                updateChart();
            });
        }

        // Build theme accent color picker
        const colorPickerContainer = document.getElementById('colorPicker');
        accentColors.forEach(color => {
            const pill = document.createElement('div');
            pill.className = 'color-pill';
            pill.style.backgroundColor = color;
            pill.onclick = () => setAccentColor(color);
            colorPickerContainer.appendChild(pill);
        });
        setAccentColor(currentAccentColor);

        setBackground(currentBg);

    } catch (err) {
        console.error('Failed to load data:', err);
        resultsContainer.innerHTML = '<div class="no-results">Error loading stats. Please try again later.</div>';
    }
}

// Global click wrapper function to bind autocomplete clicks
window.selectUser = (name) => { usernameInput.value = name; handleSearch(); };

init();
