// Fonctions utilitaires

function getFilteredData() {
    let data = rawData;
    if (filterMap[activeFilter]) {
        data = data.filter(d => filterMap[activeFilter].includes(d.vendor));
    }
    return data.filter(d => !hiddenVendors.has(d.vendor));
}

function createDatasets(data) {
    const vendors = vendorOrder.filter(vendor => data.some(d => d.vendor === vendor));
    const vendorScores = new Map();
    vendors.forEach(vendor => {
        const vendorData = data
            .filter(d => d.vendor === vendor)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        vendorScores.set(vendor, vendorData[vendorData.length - 1]?.score ?? 0);
    });
    const orderedByScore = [...vendors].sort((a, b) => vendorScores.get(a) - vendorScores.get(b));
    const scoreOrderMap = new Map(orderedByScore.map((vendor, index) => [vendor, index]));

    return vendors.map(vendor => {
        const vendorData = data
            .filter(d => d.vendor === vendor)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        const highlightIndex = vendorData.length - 1;
        const hasGradient = vendor === "google";
        const lineColor = hasGradient
            ? (context) => getGoogleGradient(context.chart.ctx, context.chart.chartArea, LINE_OPACITY)
            : withAlpha(vendorColors[vendor], LINE_OPACITY);
        const pointColor = (context) => {
            const alpha = context.dataIndex === highlightIndex ? 1 : SECONDARY_POINT_OPACITY;
            return hasGradient
                ? getGoogleGradient(context.chart.ctx, context.chart.chartArea, alpha)
                : withAlpha(vendorColors[vendor], alpha);
        };
        const pointIcon = (context) => {
            const alpha = context.dataIndex === highlightIndex ? 1 : SECONDARY_POINT_OPACITY;
            return createVendorIcon(vendor, vendorColors[vendor], alpha);
        };
        return {
            label: vendorNames[vendor],
            data: vendorData.map(d => ({
                x: new Date(d.date),
                y: d.score,
                model: d.model
            })),
            backgroundColor: lineColor,
            borderColor: lineColor,
            pointBackgroundColor: pointColor,
            pointBorderColor: pointColor,
            pointRadius: (context) => (context.dataIndex === highlightIndex ? 13 : 7),
            pointHoverRadius: (context) => (context.dataIndex === highlightIndex ? 15 : 10),
            pointBorderWidth: (context) => (context.dataIndex === highlightIndex ? 4 : 2),
            pointHitRadius: 14,
            pointStyle: pointIcon,
            showLine: true,
            borderWidth: 2,
            tension: 0.2,
            order: scoreOrderMap.get(vendor)
        };
    });
}

function updateStats(data) {
    const highest = data.reduce((a, b) => a.score > b.score ? a : b);
    document.getElementById('highScore').textContent = highest.score;
    document.getElementById('highScoreModel').textContent = highest.model;
    document.getElementById('modelCount').textContent = data.length;
    const avgProgress = Math.round((highest.score - 923) / 3.2);
    document.getElementById('avgProgress').textContent = `+${avgProgress}`;
}

function buildLegend() {
    const vendors = vendorOrder.filter(vendor => rawData.some(d => d.vendor === vendor));
    const container = document.getElementById('customLegend');
    container.innerHTML = '';
    
    vendors.forEach(vendor => {
        const item = document.createElement('div');
        item.className = `legend-item${hiddenVendors.has(vendor) ? ' inactive' : ''}`;
        item.innerHTML = `
            <span class="legend-dot" style="background: ${vendorColors[vendor]}"></span>
            <span class="legend-text">${vendorNames[vendor]}</span>
        `;
        item.addEventListener('click', () => {
            if (hiddenVendors.has(vendor)) {
                hiddenVendors.delete(vendor);
            } else {
                hiddenVendors.add(vendor);
            }
            updateChart();
            buildLegend();
        });
        container.appendChild(item);
    });
}

function getYBounds(data) {
    if (!data.length) {
        return { min: defaultYMin, max: defaultYMax };
    }
    const scores = data.map(item => item.score);
    let min = Math.min(...scores);
    let max = Math.max(...scores);
    if (min === max) {
        min -= 20;
        max += 20;
    }
    const padding = (max - min) * 0.08;
    return {
        min: Math.max(0, Math.floor(min - padding)),
        max: Math.ceil(max + padding)
    };
}

function updateChart() {
    const data = getFilteredData();
    chart.data.datasets = createDatasets(data);
    if (autoYEnabled) {
        const bounds = getYBounds(data);
        chart.options.scales.y.min = bounds.min;
        chart.options.scales.y.max = bounds.max;
        setAxisInputs(
            chart.options.scales.x.min || defaultXMin,
            chart.options.scales.x.max || defaultXMax,
            bounds.min,
            bounds.max
        );
    }
    chart.update('none');
    updateStats(data);
}

function formatDateInput(date) {
    return date.toISOString().slice(0, 10);
}

function setAxisInputs(xMin = defaultXMin, xMax = defaultXMax, yMin = defaultYMin, yMax = defaultYMax) {
    const xMinInput = document.getElementById('xMin');
    const xMaxInput = document.getElementById('xMax');
    const yMinInput = document.getElementById('yMin');
    const yMaxInput = document.getElementById('yMax');

    xMinInput.value = formatDateInput(xMin);
    xMaxInput.value = formatDateInput(xMax);
    yMinInput.value = yMin;
    yMaxInput.value = yMax;
}

function applyAxisScale(axis) {
    if (!chart) return;
    if (axis === 'x') {
        const minValue = document.getElementById('xMin').value;
        const maxValue = document.getElementById('xMax').value;
        chart.options.scales.x.min = minValue ? new Date(minValue) : undefined;
        chart.options.scales.x.max = maxValue ? new Date(maxValue) : undefined;
    }
    if (axis === 'y') {
        const minValue = document.getElementById('yMin').value;
        const maxValue = document.getElementById('yMax').value;
        chart.options.scales.y.min = minValue ? Number(minValue) : undefined;
        chart.options.scales.y.max = maxValue ? Number(maxValue) : undefined;
        autoYEnabled = false;
    }
    chart.update('none');
}

function resetAxes() {
    chart.options.scales.x.min = defaultXMin;
    chart.options.scales.x.max = defaultXMax;
    chart.options.scales.y.min = defaultYMin;
    chart.options.scales.y.max = defaultYMax;
    autoYEnabled = true;
    setAxisInputs();
}

function applyDateRange(days) {
    const endDate = new Date(today);
    let startDate;
    if (days === 'beginning') {
        startDate = dateExtent.min;
        chart.options.scales.x.max = dateExtent.max;
    } else {
        const totalDays = Number(days);
        startDate = new Date(today.getTime() - totalDays * ONE_DAY_MS);
        chart.options.scales.x.max = endDate;
    }
    chart.options.scales.x.min = startDate;
    autoYEnabled = true;
    updateChart();
    setAxisInputs(startDate, chart.options.scales.x.max, chart.options.scales.y.min, chart.options.scales.y.max);
}
