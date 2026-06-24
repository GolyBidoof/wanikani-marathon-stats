function updateMetricCheckboxes() {
    const container = document.getElementById('metricCheckboxes');
    if (!container) return;

    const cacheKey = userMetricsOrder.join(',') + '|' + Array.from(enabledMetrics).sort().join(',');
    if (lastRenderedMetrics === cacheKey) return;
    lastRenderedMetrics = cacheKey;

    container.innerHTML = '';

    userMetricsOrder.forEach((metric) => {
        const label = document.createElement('label');
        label.className = 'checkbox-pill-label';
        if (!enabledMetrics.has(metric)) label.classList.add('excluded');

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
        const metricDisplayNames = { time: 'Time', pages: 'Pages', chars: 'Chars', sources: 'Sources' };
        labelText.textContent = metricDisplayNames[metric] || metric;

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
            const idx = userMetricsOrder.indexOf(metric);
            if (idx > 0) {
                [userMetricsOrder[idx], userMetricsOrder[idx - 1]] = [userMetricsOrder[idx - 1], userMetricsOrder[idx]];
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
            const idx = userMetricsOrder.indexOf(metric);
            if (idx < userMetricsOrder.length - 1) {
                [userMetricsOrder[idx], userMetricsOrder[idx + 1]] = [userMetricsOrder[idx + 1], userMetricsOrder[idx]];
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

function getMetricValueForEntry(entry, metric) {
    if (!entry) return 0;
    if (metric === 'time') return parseTimeToHours(entry.time);
    if (metric === 'pages') return parseInt(entry.pages) || 0;
    if (metric === 'chars') return parseInt(entry.characters) || 0;
    if (metric === 'sources') return parseInt(entry.sources) || 0;
    return 0;
}

function updateMarathonCheckboxes(userMarathons) {
    const container = document.getElementById('marathonCheckboxes');
    if (!container) return;

    if (!forceCheckboxRebuild &&
        lastRenderedUser === currentQuery &&
        lastRenderedRange === currentRange &&
        lastRenderedSort === currentSortMode) {
        return;
    }

    forceCheckboxRebuild = false;
    lastRenderedUser = currentQuery;
    lastRenderedRange = currentRange;
    lastRenderedSort = currentSortMode;

    container.innerHTML = '';

    const activeSet = new Set(userMarathons);
    let visibleMarathons = userMarathonsOrder.filter(name => activeSet.has(name));

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
            return getMetricValueForEntry(entryB, firstActiveMetric) - getMetricValueForEntry(entryA, firstActiveMetric);
        });
    }

    visibleMarathons.forEach((name) => {
        const label = document.createElement('label');
        label.className = 'checkbox-pill-label';
        if (excludedMarathons.has(name)) label.classList.add('excluded');

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
        labelText.textContent = ` ${seasonEmojis[season] || ''} ${name}`;

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
            if (currentSortMode !== 'manual') userMarathonsOrder = [...visibleMarathons];
            const idx = userMarathonsOrder.indexOf(name);
            if (idx > 0) {
                [userMarathonsOrder[idx], userMarathonsOrder[idx - 1]] = [userMarathonsOrder[idx - 1], userMarathonsOrder[idx]];
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
            if (currentSortMode !== 'manual') userMarathonsOrder = [...visibleMarathons];
            const idx = userMarathonsOrder.indexOf(name);
            if (idx < userMarathonsOrder.length - 1) {
                [userMarathonsOrder[idx], userMarathonsOrder[idx + 1]] = [userMarathonsOrder[idx + 1], userMarathonsOrder[idx]];
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

function populateThemeButtons(allNames) {
    const bgButtonsContainer = document.getElementById('bgButtons');
    bgButtonsContainer.innerHTML = '';

    allNames.forEach(name => {
        const gifName = name.toLowerCase().replace(' ', '') + '.gif';
        if (gifBackgrounds.includes(gifName)) {
            const btn = document.createElement('button');
            btn.className = 'bg-btn';
            const season = name.split(' ')[0];
            btn.textContent = `${seasonEmojis[season] || ''} ${name}`;
            btn.dataset.gif = gifName;
            btn.classList.toggle('active', gifName === currentBg);
            btn.onclick = () => setBackground(gifName);
            bgButtonsContainer.appendChild(btn);
        }
    });
}

function populateUserThemeButtons(availableGifs) {
    const bgButtonsContainer = document.getElementById('bgButtons');
    bgButtonsContainer.innerHTML = '';

    availableGifs.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'bg-btn';
        const season = item.name.split(' ')[0];
        btn.textContent = `${seasonEmojis[season] || ''} ${item.name}`;
        btn.dataset.gif = item.gif;
        btn.classList.toggle('active', item.gif === currentBg);
        btn.onclick = () => setBackground(item.gif);
        bgButtonsContainer.appendChild(btn);
    });

    if (availableGifs.length > 0 && !availableGifs.find(item => item.gif === currentBg)) {
        setBackground(availableGifs[availableGifs.length - 1].gif);
    }
}

function toggleControlGroups(hasData) {
    const customizerCard = document.querySelector('.customizer-card');
    if (customizerCard) customizerCard.style.display = hasData ? 'block' : 'none';

    const displayStyle = hasData ? 'flex' : 'none';
    ['optionsGroup', 'sortGroup', 'filterGroup', 'metricsGroup'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = displayStyle;
    });

    if (hasData) updateMetricCheckboxes();
}
