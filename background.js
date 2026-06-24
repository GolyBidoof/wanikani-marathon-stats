function setBackground(gif) {
    currentBg = gif;

    bgLoadPromise = new Promise((resolve) => {
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
        btn.classList.toggle('active', btn.dataset.gif === gif);
    });

    const lowerGif = gif.toLowerCase();
    let seasonColor = null;
    if (lowerGif.startsWith('spring')) seasonColor = '#ff00aa';
    else if (lowerGif.startsWith('summer')) seasonColor = '#ffb800';
    else if (lowerGif.startsWith('winter')) seasonColor = '#00aaff';
    else if (lowerGif.startsWith('fall') || lowerGif.startsWith('autumn')) seasonColor = '#ff5f00';

    if (seasonColor) {
        setAccentColor(seasonColor);
    } else {
        if (!currentQuery) {
            updateSummaryCard();
        }
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
    updateChart();
    if (currentQuery) {
        renderResults(currentQuery);
    }
}
