function renderResults(query) {
    resultsContainer.innerHTML = '';
    let foundAny = false;
    const marathonOrders = getMarathonOrder().reverse();

    marathonOrders.forEach((mName) => {
        const entry = allStats[mName].find(e => e.user.toLowerCase() === query);
        if (entry) {
            foundAny = true;
            resultsContainer.appendChild(createCard(mName, entry, currentAccentColor));
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
    const season = title.split(' ')[0];
    const emoji = seasonEmojis[season] || '';

    const statsHtml = `
        <div class="stats-list">
            <div class="stat-item"><span class="stat-label">TIME</span><span class="stat-value">${data.time || '--'}</span></div>
            <div class="stat-item"><span class="stat-label">PAGES</span><span class="stat-value">${data.pages || '--'}</span></div>
            <div class="stat-item"><span class="stat-label">CHARACTERS</span><span class="stat-value">${data.characters ? data.characters.toLocaleString() : '--'}</span></div>
            <div class="stat-item"><span class="stat-label">SOURCES</span><span class="stat-value">${data.sources || '--'}</span></div>
        </div>`;

    const linkHtml = data.url
        ? `<a href="${data.url}" target="_blank" class="card-link" style="color: var(--wk-blue);">View Original Post →</a>`
        : '';

    card.innerHTML = `<div class="card-header" style="background-color: ${color};">
        <span class="marathon-name">${emoji} ${title}</span>
    </div>
    <div class="card-body">${statsHtml}${linkHtml}</div>`;

    return card;
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
                backgroundColor: `${currentAccentColor}1a`,
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
            interaction: { mode: 'index', intersect: false },
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
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { display: true, text: 'MARATHON', color: '#919191' },
                    ticks: { color: '#919191' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed.y;
                            if (currentMetric === 'time') return `Time: ${formatHours(val)}`;
                            if (currentMetric === 'characters') return `Characters: ${val.toLocaleString()}`;
                            if (currentMetric === 'pages') return `Pages: ${val.toLocaleString()}`;
                            if (currentMetric === 'sources') return `Sources: ${val.toLocaleString()}`;
                            if (currentMetric === 'participants') return `Participants: ${val.toLocaleString()}`;
                            return val;
                        }
                    }
                }
            }
        }
    });
}

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
                        if (currentMetric === 'time') value = parseTimeToHours(value);
                        totalValue += parseFloat(value) || 0;
                    });
                    dataPoints.push(totalValue);
                }
            }
        });
    } else {
        const filterTotals = document.getElementById('filterTotalsToggle')?.checked;
        marathonNames.forEach(name => {
            const entry = allStats[name].find(e => e.user.toLowerCase() === currentQuery);
            if (!entry) return;
            if (filterTotals && excludedMarathons.has(name)) return;

            labels.push(name);
            let value = entry[currentMetric] || 0;
            if (currentMetric === 'time') value = parseTimeToHours(value);
            dataPoints.push(parseFloat(value) || 0);
        });
    }

    if (dataPoints.length > 0) {
        chartSection.style.display = 'block';
        renderChart(labels, dataPoints);
    } else {
        chartSection.style.display = 'none';
    }
}
