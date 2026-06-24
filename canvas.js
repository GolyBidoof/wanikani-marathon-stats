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

function drawCanvasOverlay(ctx) {
    const grad = ctx.createLinearGradient(0, 0, CANVAS_LAYOUT.width, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_LAYOUT.width, CANVAS_LAYOUT.height);
}

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

function drawCanvasMainDetails(ctx, name, time, accentColor) {
    ctx.textAlign = 'left';
    ctx.font = CANVAS_LAYOUT.fontTitle;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name.toUpperCase(), CANVAS_LAYOUT.leftX, 85);

    ctx.font = CANVAS_LAYOUT.fontTagline;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('WaniKani Reading Marathon', CANVAS_LAYOUT.leftX, 110);

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

function sortHistoryData(history) {
    const sorted = [...history];
    const firstActiveMetric = userMetricsOrder.find(m => enabledMetrics.has(m));

    if (currentSortMode === 'metric' && firstActiveMetric) {
        sorted.sort((a, b) => {
            const entryA = allStats[a]?.find(e => e.user.toLowerCase() === currentQuery);
            const entryB = allStats[b]?.find(e => e.user.toLowerCase() === currentQuery);
            return getMetricValueForEntry(entryB, firstActiveMetric) - getMetricValueForEntry(entryA, firstActiveMetric);
        });
    } else if (currentSortMode === 'manual') {
        sorted.sort((a, b) => userMarathonsOrder.indexOf(a) - userMarathonsOrder.indexOf(b));
    }
    return sorted;
}

function buildMetricsSubline(marathonName) {
    const subLineParts = [];
    userMetricsOrder.forEach(metric => {
        if (!enabledMetrics.has(metric)) return;
        const entry = allStats[marathonName]?.find(e => e.user.toLowerCase() === currentQuery);
        if (!entry) return;

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
    });
    return subLineParts;
}

function drawCanvasHistorySidebar(ctx, history, accentColor, showHistory) {
    if (!showHistory || history.length === 0 || !currentQuery) return;

    ctx.textAlign = 'right';
    ctx.shadowBlur = 0;
    let yStart = CANVAS_LAYOUT.historyYStart;

    const userMarathons = getMarathonOrder().filter(n =>
        allStats[n]?.find(x => x.user.toLowerCase() === currentQuery)
    );
    const headerLabel = getSidebarHeaderLabel(userMarathons, excludedMarathons);

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

        const labelText = `${season.substring(0, 3).toUpperCase()} '${shortYear}`;
        ctx.font = CANVAS_LAYOUT.fontHistoryLabel;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(labelText, CANVAS_LAYOUT.rightX, currentY);

        const textWidth = ctx.measureText(labelText).width;
        ctx.textAlign = 'left';
        ctx.fillText(emoji, CANVAS_LAYOUT.rightX - textWidth - 18, currentY);
        ctx.textAlign = 'right';

        const subLineParts = buildMetricsSubline(hItem);
        if (subLineParts.length > 0) {
            ctx.font = CANVAS_LAYOUT.fontHistorySubline;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillText(subLineParts.join(' • '), CANVAS_LAYOUT.rightX, currentY + 11);
        }

        currentY += lineHeight;
    });

    if (isTruncated) {
        ctx.font = CANVAS_LAYOUT.fontHistoryLabel;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('...', CANVAS_LAYOUT.rightX, currentY);
    }
}

function drawCanvas(name, time, count, pages, chars, sources, forExport = false, themeName = '', history = []) {
    if (!forExport) {
        currentCardState = { name, time, count, pages, chars, sources, themeName, history };
    }
    const canvas = document.getElementById('summaryCardCanvas');
    const ctx = canvas.getContext('2d');

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#232323';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(2, 2);

    drawCanvasBackground(ctx, document.getElementById('bgGifCanvas'));
    drawCanvasOverlay(ctx);
    drawCanvasBorder(ctx, currentAccentColor);
    drawCanvasMainDetails(ctx, name, time, currentAccentColor);
    drawCanvasStatsRow(ctx, count, pages, chars, sources);

    const showHistoryToggle = document.getElementById('showHistoryToggle');
    const showHistory = showHistoryToggle ? showHistoryToggle.checked : true;
    drawCanvasHistorySidebar(ctx, history, currentAccentColor, showHistory);

    ctx.restore();
}

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
