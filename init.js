const usernameInput = document.getElementById('usernameInput');
const userList = document.getElementById('userList');
const resultsContainer = document.getElementById('results');
const chartSection = document.getElementById('chart-section');
const summarySection = document.getElementById('summary-section');
const chartTabs = document.querySelectorAll('.chart-tab');
const rangeBtns = document.querySelectorAll('.range-toggle .toggle-btn');
const downloadBtn = document.getElementById('downloadBtn');

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

        document.querySelectorAll('.sort-toggle .toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => setSortMode(btn.dataset.sort));
        });

        downloadBtn.addEventListener('click', downloadCanvas);
        document.getElementById('copyBtn').addEventListener('click', copyCanvas);

        const infoBtn = document.getElementById('infoBtn');
        const infoPanel = document.getElementById('infoPanel');
        infoBtn.addEventListener('click', () => {
            const isVisible = infoPanel.style.display === 'block';
            infoPanel.style.display = isVisible ? 'none' : 'block';
            infoBtn.textContent = isVisible ? 'What is this?' : 'Hide info';
        });

        const customizerToggleBtn = document.getElementById('customizerToggleBtn');
        const customizerContent = document.getElementById('customizerContent');
        const customizerCard = document.querySelector('.customizer-card');
        if (customizerToggleBtn && customizerContent && customizerCard) {
            customizerToggleBtn.addEventListener('click', () => {
                const isExpanded = customizerCard.classList.toggle('expanded');
                customizerContent.style.display = isExpanded ? 'block' : 'none';
            });
        }

        const showHistoryToggle = document.getElementById('showHistoryToggle');
        if (showHistoryToggle) {
            showHistoryToggle.addEventListener('change', () => {
                if (showHistoryToggle.checked && enabledMetrics.size === 0) {
                    enabledMetrics.add('time');
                    updateMetricCheckboxes();
                }
                if (currentQuery) updateSummaryCard();
            });
        }

        const filterTotalsToggle = document.getElementById('filterTotalsToggle');
        if (filterTotalsToggle) {
            filterTotalsToggle.addEventListener('change', () => {
                updateSummaryCard();
                updateChart();
            });
        }

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
                const lastYearMarathons = new Set(getMarathonOrder().slice(-4));
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

window.selectUser = (name) => { usernameInput.value = name; handleSearch(); };

init();
