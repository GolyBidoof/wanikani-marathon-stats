let allStats = {};
let allUsers = [];

const usernameInput = document.getElementById('usernameInput');
const userList = document.getElementById('userList');
const resultsContainer = document.getElementById('results');
const chartSection = document.getElementById('chart-section');
const summarySection = document.getElementById('summary-section');
const chartTabs = document.querySelectorAll('.chart-tab');
const rangeBtns = document.querySelectorAll('.toggle-btn');
const downloadBtn = document.getElementById('downloadBtn');
let historyChart = null;
let currentMetric = 'time';
let currentRange = 'all';
let currentQuery = '';

const gifBackgrounds = [
    'fall2024.gif',
    'autumn2025.gif',
    'spring2025.gif',
    'summer2024.gif',
    'summer2025.gif',
    'winter2024.gif',
    'winter2025.gif'
];
let currentBg = gifBackgrounds[Math.floor(Math.random() * gifBackgrounds.length)];
const bgImages = {};
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

async function init() {
    try {
        const statsRes = await fetch('all_stats.json');
        allStats = await statsRes.json();

        const usersRes = await fetch('users.json');
        allUsers = await usersRes.json();

        // Populate datalist
        allUsers.forEach(user => {
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

        rangeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                rangeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentRange = btn.dataset.range;
                handleSearch(); // Re-trigger with updated range
            });
        });

        downloadBtn.addEventListener('click', downloadCanvas);

        const copyBtn = document.getElementById('copyBtn');
        copyBtn.addEventListener('click', copyCanvas);

        // Info Toggle
        const infoBtn = document.getElementById('infoBtn');
        const infoPanel = document.getElementById('infoPanel');
        infoBtn.addEventListener('click', () => {
            const isVisible = infoPanel.style.display === 'block';
            infoPanel.style.display = isVisible ? 'none' : 'block';
            infoBtn.textContent = isVisible ? 'What is this?' : 'Hide info';
        });

        // Init color picker
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

function setBackground(gif) {
    currentBg = gif;
    const outer = document.getElementById('achievementCardOuter');
    if (outer) outer.style.backgroundImage = `url(${gif})`;

    document.querySelectorAll('.bg-btn').forEach(btn => {
        const btnGif = btn.dataset.gif;
        btn.classList.toggle('active', btnGif === gif);
    });

    if (!bgImages[gif]) {
        bgImages[gif] = new Image();
        bgImages[gif].src = gif;
    }

    if (!currentQuery) {
        updateSummaryCard();
    }
}

function setAccentColor(color) {
    currentAccentColor = color;
    document.documentElement.style.setProperty('--accent-color', color);
    document.querySelectorAll('.color-pill').forEach(pill => {
        pill.classList.toggle('active', pill.style.backgroundColor === color ||
            rgbToHex(pill.style.backgroundColor) === color);
    });

    updateSummaryCard();
    if (currentQuery) {
        updateChart();
        renderResults(currentQuery);
    }
}

function rgbToHex(rgb) {
    if (!rgb) return '';
    const m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!m) return rgb;
    return '#' + [1, 2, 3].map(i => parseInt(m[i]).toString(16).padStart(2, '0')).join('');
}

function handleSearch() {
    const query = usernameInput.value.trim().toLowerCase();

    if (!query) {
        resultsContainer.innerHTML = '';
        chartSection.style.display = 'none';
        currentQuery = '';
        updateSummaryCard();
        return;
    }

    currentQuery = query;
    renderResults(query);
    updateChart();
    updateSummaryCard();
}

function getMarathonOrder() {
    const allNames = Object.keys(allStats).sort((a, b) => {
        const getVal = (s) => {
            const [season, year] = s.split(' ');
            const seasonScore = { 'Winter': 4, 'Fall': 3, 'Autumn': 3, 'Summer': 2, 'Spring': 1 }[season] || 0;
            return parseInt(year) * 10 + seasonScore;
        };
        return getVal(a) - getVal(b); // Chronological
    });

    if (currentRange === 'year') {
        // Return only the most recent 4 (approx 1 year) or based on year number
        // For simplicity, let's just take the last 4 if they exist
        return allNames.slice(-4);
    }
    return allNames;
}

function updateChart() {
    if (!currentQuery) return;

    const marathonNames = getMarathonOrder();
    const labels = [];
    const dataPoints = [];

    marathonNames.forEach(name => {
        const entries = allStats[name];
        const entry = entries.find(e => e.user.toLowerCase() === currentQuery);

        if (entry) {
            labels.push(name);
            let value = entry[currentMetric] || 0;

            if (currentMetric === 'time' && typeof value === 'string') {
                const parts = value.split(':');
                if (parts.length >= 2) {
                    // Convert HH:MM:SS to decimal hours
                    const h = parseInt(parts[0]) || 0;
                    const m = parseInt(parts[1]) || 0;
                    const s = parseInt(parts[2]) || 0;
                    value = h + (m / 60) + (s / 3600);
                } else {
                    value = parseFloat(value) || 0;
                }
            }
            dataPoints.push(parseFloat(value) || 0);
        }
    });

    if (dataPoints.length > 0) {
        chartSection.style.display = 'block';
        renderChart(labels, dataPoints);
    } else {
        chartSection.style.display = 'none';
    }
}

function updateSummaryCard() {
    const marathonNames = getMarathonOrder();
    let totalTime = 0, totalPages = 0, totalChars = 0, totalSources = 0, participatedCount = 0, userName = '';
    const participatedMarathons = [];

    if (!currentQuery) {
        const selectedMarathon = marathonNames.find(n => (n.toLowerCase().replace(' ', '') + '.gif') === currentBg);
        if (selectedMarathon) {
            const participants = allStats[selectedMarathon];
            userName = selectedMarathon;
            participatedCount = participants.length;
            participatedMarathons.push(selectedMarathon);

            participants.forEach(entry => {
                if (entry.time && typeof entry.time === 'string') {
                    const parts = entry.time.split(':');
                    totalTime += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
                }
                totalPages += parseInt(entry.pages) || 0;
                totalChars += parseInt(entry.characters) || 0;
                totalSources += parseInt(entry.sources) || 0;
            });
        }

        summarySection.style.display = 'flex';
        const bgButtonsContainer = document.getElementById('bgButtons');
        bgButtonsContainer.innerHTML = '';

        marathonNames.forEach(name => {
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

        const outer = document.getElementById('achievementCardOuter');
        if (outer) outer.style.backgroundImage = `url(${currentBg})`;

        drawCanvas(userName, totalTime, participatedCount, totalPages, totalChars, totalSources, false, selectedMarathon || '', participatedMarathons);
        return;
    }

    marathonNames.forEach(name => {
        const entry = allStats[name].find(e => e.user.toLowerCase() === currentQuery);
        if (entry) {
            userName = entry.user;
            participatedCount++;
            participatedMarathons.push(name);
            if (entry.time && typeof entry.time === 'string') {
                const parts = entry.time.split(':');
                totalTime += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
            }
            totalPages += parseInt(entry.pages) || 0;
            totalChars += parseInt(entry.characters) || 0;
            totalSources += parseInt(entry.sources) || 0;
        }
    });

    if (participatedCount > 0) {
        summarySection.style.display = 'flex';
        const bgButtonsContainer = document.getElementById('bgButtons');
        bgButtonsContainer.innerHTML = '';

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

        availableGifs.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'bg-btn';
            const season = item.name.split(' ')[0];
            const emoji = seasonEmojis[season] || '';
            btn.textContent = `${emoji} ${item.name}`;
            btn.dataset.gif = item.gif;
            btn.onclick = () => setBackground(item.gif);
            bgButtonsContainer.appendChild(btn);
        });

        if (availableGifs.length > 0) {
            if (!availableGifs.some(g => g.gif === currentBg)) {
                currentBg = availableGifs[Math.floor(Math.random() * availableGifs.length)].gif;
            }
            const outer = document.getElementById('achievementCardOuter');
            if (outer) outer.style.backgroundImage = `url(${currentBg})`;
            document.querySelectorAll('.bg-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.gif === currentBg));

            const currentBgItem = availableGifs.find(g => g.gif === currentBg);
            const label = currentBgItem ? currentBgItem.name : '';

            drawCanvas(userName, totalTime, participatedCount, totalPages, totalChars, totalSources, false, label, participatedMarathons);
        }
    } else {
        summarySection.style.display = 'none';
    }
}

function drawCanvas(name, time, count, pages, chars, sources, forExport = false, themeName = '', history = []) {
    const canvas = document.getElementById('summaryCardCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (forExport) {
        if (bgImages[currentBg] && bgImages[currentBg].complete) {
            // Draw background with "cover" behavior (match CSS background-size: cover)
            const img = bgImages[currentBg];
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const canvasRatio = canvas.width / canvas.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgRatio > canvasRatio) {
                // Image is wider - fit height, crop width
                drawHeight = canvas.height;
                drawWidth = img.naturalWidth * (canvas.height / img.naturalHeight);
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            } else {
                // Image is taller - fit width, crop height
                drawWidth = canvas.width;
                drawHeight = img.naturalHeight * (canvas.width / img.naturalWidth);
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            ctx.fillStyle = '#232323';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Gradient overlay for export (matches CSS .card-overlay)
        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.strokeStyle = currentAccentColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

    const leftX = 60;
    const rightX = canvas.width - 60;

    // Top left: Username
    ctx.textAlign = 'left';
    ctx.font = '700 42px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name.toUpperCase(), leftX, 85);

    // Tagline under username
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('WaniKani Reading Marathon', leftX, 110);

    // Center: Big time display
    ctx.textAlign = 'center';
    ctx.shadowBlur = 15;
    ctx.font = '800 90px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#ffffff';
    const h = Math.floor(time);
    const m = Math.round((time - h) * 60);
    ctx.fillText(`${h}h ${m}m`, canvas.width / 2, 220);

    ctx.shadowBlur = 5;
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = currentAccentColor;
    ctx.fillText('TOTAL TIME READ', canvas.width / 2, 250);

    // Bottom: Stats row
    const pagesStr = pages > 0 ? pages.toLocaleString() : '–';
    const charsStr = chars > 0 ? chars.toLocaleString() : '–';

    const stats = [
        { label: currentQuery ? 'MARATHONS' : 'PARTICIPANTS', value: count },
        { label: 'PAGES', value: pagesStr },
        { label: 'CHARS', value: charsStr },
        { label: 'SOURCES', value: sources }
    ];

    const statY = 330;
    const spacing = canvas.width / 5;
    stats.forEach((s, i) => {
        const x = spacing * (i + 1);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.font = '700 26px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(s.value, x, statY);
        ctx.shadowBlur = 2;
        ctx.font = '600 10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText(s.label, x, statY + 18);
    });

    // Top right: Participation history (for individual users)
    if (history.length > 0 && currentQuery) {
        ctx.textAlign = 'right';
        ctx.shadowBlur = 0;
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
        let yStart = 75;

        history.forEach((hItem, i) => {
            const [s, year] = hItem.split(' ');
            const emoji = seasonEmojis[s] || '';
            const shortYear = year.slice(-2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(`${emoji} ${s.substring(0, 3).toUpperCase()} '${shortYear}`, rightX, yStart + (i * 16));
        });
    }
}

function downloadCanvas() {
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
                if (entry.time && typeof entry.time === 'string') {
                    const parts = entry.time.split(':');
                    tTime += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
                }
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
                if (e.time) {
                    const p = e.time.split(':');
                    tTime += (parseInt(p[0]) || 0) + (parseInt(p[1]) || 0) / 60;
                }
                tPages += parseInt(e.pages) || 0;
                tChars += parseInt(e.characters) || 0;
                tSources += parseInt(e.sources) || 0;
            }
        });
    }

    const bgItem = gifBackgrounds.find(g => g === currentBg);
    const label = bgItem ? bgItem.replace('.gif', '').replace(/([a-z]+)(\d+)/i, (m, s, y) => s.charAt(0).toUpperCase() + s.slice(1) + ' ' + y) : '';

    drawCanvas(uName, tTime, count, tPages, tChars, tSources, true, label, participatedMarathons);
    const canvas = document.getElementById('summaryCardCanvas');
    const link = document.createElement('a');
    link.download = `${currentQuery || 'community'}_achievement.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    drawCanvas(uName, tTime, count, tPages, tChars, tSources, false, label, participatedMarathons);
}

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
                if (entry.time && typeof entry.time === 'string') {
                    const parts = entry.time.split(':');
                    tTime += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
                }
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
                if (e.time) {
                    const p = e.time.split(':');
                    tTime += (parseInt(p[0]) || 0) + (parseInt(p[1]) || 0) / 60;
                }
                tPages += parseInt(e.pages) || 0;
                tChars += parseInt(e.characters) || 0;
                tSources += parseInt(e.sources) || 0;
            }
        });
    }

    const bgItem = gifBackgrounds.find(g => g === currentBg);
    const label = bgItem ? bgItem.replace('.gif', '').replace(/([a-z]+)(\d+)/i, (m, s, y) => s.charAt(0).toUpperCase() + s.slice(1) + ' ' + y) : '';

    drawCanvas(uName, tTime, count, tPages, tChars, tSources, true, label, participatedMarathons);
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

    drawCanvas(uName, tTime, count, tPages, tChars, tSources, false, label, participatedMarathons);
}

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
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: currentMetric.toUpperCase(), color: '#919191' }, ticks: { color: '#919191' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: 'MARATHON', color: '#919191' }, ticks: { color: '#919191' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderResults(query) {
    resultsContainer.innerHTML = '';
    let foundAny = false;
    const marathonOrders = getMarathonOrder().reverse();

    marathonOrders.forEach((mName, idx) => {
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

window.selectUser = (name) => { usernameInput.value = name; handleSearch(); };

init();
