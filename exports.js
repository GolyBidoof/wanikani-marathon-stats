function aggregateStatsForExport() {
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

    return { tTime, tPages, tChars, tSources, count, uName, participatedMarathons };
}

async function downloadCanvas() {
    await ensureBgLoaded();
    const canvas = document.getElementById('summaryCardCanvas');
    const link = document.createElement('a');
    link.download = `${currentQuery || 'community'}_achievement.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function copyCanvas() {
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
