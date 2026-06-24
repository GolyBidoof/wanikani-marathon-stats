function setSortMode(mode) {
    currentSortMode = mode;
    document.querySelectorAll('.sort-toggle .toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === mode);
    });
    updateSummaryCard();
}

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

function calculateCommunityTotals() {
    const allNames = getMarathonOrder();

    let totalTime = 0, totalPages = 0, totalChars = 0, totalSources = 0, participatedCount = 0;
    const participatedMarathons = [];

    const selectedMarathon = allNames.find(n => (n.toLowerCase().replace(' ', '') + '.gif') === currentBg);
    if (selectedMarathon) {
        const participants = allStats[selectedMarathon];
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

    drawCanvas(selectedMarathon || '', totalTime, participatedCount, totalPages, totalChars, totalSources, false, selectedMarathon || '', participatedMarathons);
}

function calculateUserTotals(marathonNames) {
    let totalTime = 0, totalPages = 0, totalChars = 0, totalSources = 0, participatedCount = 0;
    const userName = allUsers.find(u => u.toLowerCase() === currentQuery) || currentQuery;
    const participatedMarathons = [];

    if (activeUserForOrder !== currentQuery) {
        activeUserForOrder = currentQuery;
        userMarathonsOrder = getMarathonOrder().filter(name =>
            allStats[name].find(e => e.user.toLowerCase() === currentQuery)
        );
    }

    const filterTotals = document.getElementById('filterTotalsToggle')?.checked;

    marathonNames.forEach(name => {
        const entry = allStats[name].find(e => e.user.toLowerCase() === currentQuery);
        if (entry) {
            participatedMarathons.push(name);
            if (!filterTotals || !excludedMarathons.has(name)) {
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

        const availableGifs = marathonNames
            .filter(name => allStats[name].find(e => e.user.toLowerCase() === currentQuery))
            .map(name => ({ name, gif: name.toLowerCase().replace(' ', '') + '.gif' }))
            .filter(item => gifBackgrounds.includes(item.gif));

        populateUserThemeButtons(availableGifs);

        const currentBgItem = availableGifs.find(g => g.gif === currentBg);
        const label = currentBgItem ? currentBgItem.name : '';

        drawCanvas(userName, totalTime, participatedCount, totalPages, totalChars, totalSources, false, label, includedMarathons);
    } else {
        summarySection.style.display = 'none';
    }
}

function updateSummaryCard() {
    const marathonNames = getMarathonOrder();
    if (!currentQuery) {
        calculateCommunityTotals();
    } else {
        calculateUserTotals(marathonNames);
    }
}
