// Plugins personnalisés pour Chart.js

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
