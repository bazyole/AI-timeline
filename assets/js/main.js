import { filterMap, rawData, vendorColors, vendorNames, vendorOrder } from './data.js';

const LINE_OPACITY = 0.7;
const SECONDARY_POINT_OPACITY = 0.4;
const LATEST_LABEL_OPACITY = 0.9;
const SECONDARY_LABEL_OPACITY = 0.45;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const LABEL_RANGE_THRESHOLD_MS = 548 * ONE_DAY_MS;

const today = new Date();
const dateExtent = rawData.reduce(
    (acc, entry) => {
        const date = new Date(entry.date);
        return {
            min: acc.min < date ? acc.min : date,
            max: acc.max > date ? acc.max : date
        };
    },
    { min: new Date(rawData[0].date), max: new Date(rawData[0].date) }
);

const defaultXMin = dateExtent.min;
const defaultXMax = dateExtent.max;
const defaultYMin = 650;
const defaultYMax = 1450;

let chart;
let activeFilter = 'all';
let hiddenVendors = new Set(['zhipu', 'minimax', 'meta', 'mistral']);
let autoYEnabled = true;

const chartLib = window.Chart;

function getFilteredData() {
    const filters = filterMap[activeFilter];
    if (!filters) {
        return rawData.filter(item => !hiddenVendors.has(item.vendor));
    }
    return rawData.filter(item => filters.includes(item.vendor) && !hiddenVendors.has(item.vendor));
}

function createVendorIcon(vendor, color, alpha) {
    const canvas = document.createElement('canvas');
    const size = 14;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = withAlpha(color, alpha);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    return canvas;
}

function withAlpha(hex, alpha) {
    const sanitized = hex.replace('#', '');
    const r = parseInt(sanitized.substring(0, 2), 16);
    const g = parseInt(sanitized.substring(2, 4), 16);
    const b = parseInt(sanitized.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getGoogleGradient(ctx, chartArea, alpha) {
    if (!chartArea) {
        return withAlpha(vendorColors.google, alpha);
    }
    const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
    gradient.addColorStop(0, withAlpha('#4285F4', alpha));
    gradient.addColorStop(0.5, withAlpha('#34A853', alpha));
    gradient.addColorStop(1, withAlpha('#FBBC05', alpha));
    return gradient;
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
        const hasGradient = vendor === 'google';
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

const modelLabelPlugin = {
    id: 'modelLabels',
    afterDatasetsDraw(chartInstance) {
        const { ctx } = chartInstance;
        const xScale = chartInstance.scales.x;
        const xMin = xScale?.min ?? defaultXMin.getTime();
        const xMax = xScale?.max ?? defaultXMax.getTime();
        const rangeMs = xMax - xMin;
        const showAllLabels = rangeMs <= LABEL_RANGE_THRESHOLD_MS;
        ctx.save();
        ctx.font = '500 9px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(245, 245, 245, 0.85)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        chartInstance.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chartInstance.getDatasetMeta(datasetIndex);
            if (meta.hidden) return;
            const lastIndex = dataset.data.length - 1;
            meta.data.forEach((element, index) => {
                const pointData = dataset.data[index];
                if (!pointData || !pointData.model) return;
                if (!showAllLabels && index !== lastIndex) return;
                const position = element.tooltipPosition();
                ctx.globalAlpha = index === lastIndex ? LATEST_LABEL_OPACITY : SECONDARY_LABEL_OPACITY;
                ctx.fillText(pointData.model, position.x + 8, position.y - 8);
            });
        });

        ctx.restore();
    }
};

const latestModelHighlightPlugin = {
    id: 'latestModelHighlight',
    afterDatasetsDraw(chartInstance) {
        const { ctx } = chartInstance;
        ctx.save();
        chartInstance.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chartInstance.getDatasetMeta(datasetIndex);
            if (meta.hidden) return;
            const lastIndex = dataset.data.length - 1;
            const point = meta.data[lastIndex];
            if (!point) return;
            const position = point.tooltipPosition();
            const baseRadius = point.options?.radius || 10;
            ctx.strokeStyle = dataset.borderColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            ctx.arc(position.x, position.y, baseRadius + 7, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.restore();
    }
};

function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const data = getFilteredData();

    chart = new chartLib(ctx, {
        type: 'scatter',
        data: { datasets: createDatasets(data) },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            plugins: {
                legend: { display: false },
                modelLabels: {},
                latestModelHighlight: {},
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        threshold: 0,
                        mouseButtons: {
                            left: false,
                            middle: false,
                            right: true
                        }
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.05
                        },
                        pinch: {
                            enabled: true
                        },
                        drag: {
                            enabled: true,
                            borderColor: 'rgba(245, 245, 245, 0.6)',
                            borderWidth: 1,
                            backgroundColor: 'rgba(245, 245, 245, 0.08)'
                        },
                        mode: 'xy'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#aaa',
                    borderColor: '#333',
                    borderWidth: 1,
                    cornerRadius: 2,
                    padding: 14,
                    titleFont: {
                        family: 'Space Grotesk',
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'IBM Plex Mono',
                        size: 11
                    },
                    callbacks: {
                        title: (items) => items[0]?.raw?.model || '',
                        label: (item) => `Score: ${item.raw.y}`,
                        afterLabel: (item) => {
                            const date = new Date(item.raw.x);
                            return date.toLocaleDateString('fr-FR', {
                                month: 'long',
                                year: 'numeric'
                            });
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    min: defaultXMin,
                    max: defaultXMax,
                    time: {
                        unit: 'month',
                        displayFormats: { month: 'MMM yy' }
                    },
                    grid: {
                        color: '#2a2a2a',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#555',
                        font: { family: 'IBM Plex Mono', size: 10 }
                    },
                    title: {
                        display: true,
                        text: 'Date de sortie',
                        color: '#666',
                        font: { family: 'Space Grotesk', size: 11 }
                    }
                },
                y: {
                    min: defaultYMin,
                    max: defaultYMax,
                    grid: {
                        color: '#2a2a2a',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#555',
                        font: { family: 'IBM Plex Mono', size: 10 }
                    },
                    title: {
                        display: true,
                        text: 'Score Coding',
                        color: '#666',
                        font: { family: 'Space Grotesk', size: 11 }
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            }
        },
        plugins: [modelLabelPlugin, latestModelHighlightPlugin]
    });

    updateStats(data);
    buildLegend();
    setAxisInputs();
}

function panChartBy(deltaX, deltaY) {
    if (!chart) return;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const xMin = xScale?.min ?? defaultXMin.getTime();
    const xMax = xScale?.max ?? defaultXMax.getTime();
    const yMin = yScale?.min ?? defaultYMin;
    const yMax = yScale?.max ?? defaultYMax;

    chart.options.scales.x.min = new Date(xMin + deltaX);
    chart.options.scales.x.max = new Date(xMax + deltaX);
    chart.options.scales.y.min = yMin + deltaY;
    chart.options.scales.y.max = yMax + deltaY;
    autoYEnabled = false;
    chart.update('none');
}

function handleArrowPan(event) {
    if (!chart) return;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    if (!xScale || !yScale) return;

    const xRange = (xScale.max ?? defaultXMax.getTime()) - (xScale.min ?? defaultXMin.getTime());
    const yRange = (yScale.max ?? defaultYMax) - (yScale.min ?? defaultYMin);
    const stepFactor = event.shiftKey ? 0.2 : 0.08;
    const xStep = xRange * stepFactor;
    const yStep = yRange * stepFactor;

    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            panChartBy(-xStep, 0);
            break;
        case 'ArrowRight':
            event.preventDefault();
            panChartBy(xStep, 0);
            break;
        case 'ArrowUp':
            event.preventDefault();
            panChartBy(0, yStep);
            break;
        case 'ArrowDown':
            event.preventDefault();
            panChartBy(0, -yStep);
            break;
        default:
            break;
    }
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        updateChart();
    });
});

document.getElementById('applyX').addEventListener('click', () => applyAxisScale('x'));
document.getElementById('applyY').addEventListener('click', () => applyAxisScale('y'));
document.getElementById('zoomIn').addEventListener('click', () => chart.zoom(1.2));
document.getElementById('zoomOut').addEventListener('click', () => chart.zoom(0.8));
document.getElementById('resetZoom').addEventListener('click', () => {
    chart.resetZoom();
    resetAxes();
    chart.update('none');
});
document.querySelectorAll('[data-range]').forEach(btn => {
    btn.addEventListener('click', () => applyDateRange(btn.dataset.range));
});

document.getElementById('mainChart').addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

window.addEventListener('keydown', handleArrowPan);

initChart();
