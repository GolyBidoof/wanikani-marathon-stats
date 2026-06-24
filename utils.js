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

function formatHours(time) {
    const totalMinutes = Math.round(time * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
}

function rgbToHex(rgb) {
    if (!rgb) return '';
    const m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!m) return rgb;
    return '#' + [1, 2, 3].map(i => parseInt(m[i]).toString(16).padStart(2, '0')).join('');
}

function ensureBgLoaded() {
    if (!bgLoadPromise) return Promise.resolve();
    return bgLoadPromise;
}

function getMarathonOrder() {
    return Object.keys(allStats).sort((a, b) => {
        const getVal = (s) => {
            const [season, year] = s.split(' ');
            const seasonScore = { 'Winter': 4, 'Fall': 3, 'Autumn': 3, 'Summer': 2, 'Spring': 1 }[season] || 0;
            return parseInt(year) * 10 + seasonScore;
        };
        return getVal(a) - getVal(b);
    });
}

function getSidebarHeaderLabel(participatedMarathons, excludedMarathons) {
    const allMarathons = getMarathonOrder();
    const checkedMarathons = allMarathons.filter(m => !excludedMarathons.has(m));

    if (checkedMarathons.length === 0) return "NONE";

    if (checkedMarathons.length === allMarathons.length) {
        return "ALL TIME";
    }

    const last4 = allMarathons.slice(-4);
    const isLast4Selected = checkedMarathons.length === 4 && checkedMarathons.every(m => last4.includes(m));
    if (isLast4Selected) {
        return "PAST 4";
    }

    const years = checkedMarathons.map(m => m.split(' ').pop());
    const uniqueCheckedYears = [...new Set(years)];
    if (uniqueCheckedYears.length === 1) {
        const targetYear = uniqueCheckedYears[0];
        const allYearMarathons = allMarathons.filter(m => m.endsWith(targetYear));
        const isOnlyYearSelected = checkedMarathons.length === allYearMarathons.length &&
                                   checkedMarathons.every(m => allYearMarathons.includes(m));
        if (isOnlyYearSelected) {
            return `YEAR ${targetYear}`;
        }
    }

    return "MANUAL";
}
