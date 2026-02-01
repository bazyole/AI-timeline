// Logique principale du graphique

function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const data = getFilteredData();
    
    chart = new Chart(ctx, {
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
