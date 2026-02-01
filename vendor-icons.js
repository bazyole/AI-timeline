// Gestion des icônes et logos de vendeurs

const iconCache = new Map();
const logoCache = new Map();

const vendorLogos = {
    openai: "https://github.com/openai.png",
    anthropic: "https://github.com/anthropics.png",
    google: "https://github.com/google.png",
    alibaba: "https://github.com/QwenLM.png",
    deepseek: "https://github.com/deepseek-ai.png",
    meta: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/meta-color.png",
    mistral: "https://github.com/mistralai.png",
    zhipu: "https://pbs.twimg.com/profile_images/1970775077181411328/W8XKaUIh.jpg",
    xai: "https://github.com/xai-org.png",
    minimax: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.75.0/files/dark/minimax-color.png",
    moonshot: "https://aimode.co/wp-content/uploads/2025/03/Kimi-AI-Logo.webp"
};

const vendorInitials = {
    openai: "O",
    anthropic: "A",
    google: "G",
    alibaba: "Q",
    deepseek: "D",
    meta: "M",
    xai: "X",
    mistral: "Mi",
    zhipu: "Z",
    minimax: "Mx",
    moonshot: "K"
};

function drawVendorIcon(ctx, size, color, image, initials, opacity = 1) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    if (image && image.complete && image.naturalWidth && !image.dataset.failed) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(image, 4, 4, size - 8, size - 8);
        ctx.restore();
    } else if (initials) {
        ctx.fillStyle = '#f5f5f5';
        ctx.font = '600 10px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, size / 2, size / 2);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function getVendorLogo(vendor) {
    if (logoCache.has(vendor)) {
        return logoCache.get(vendor);
    }
    const image = new Image();
    image.src = vendorLogos[vendor];
    image.addEventListener('error', () => {
        image.dataset.failed = 'true';
        if (chart) {
            chart.update('none');
        }
    });
    logoCache.set(vendor, image);
    return image;
}

function createVendorIcon(vendor, color, opacity = 1) {
    const cacheKey = `${vendor}-${color}-${opacity}`;
    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey);
    }

    const canvas = document.createElement('canvas');
    const size = 26;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const image = getVendorLogo(vendor);
    drawVendorIcon(ctx, size, color, image, vendorInitials[vendor], opacity);

    image.addEventListener('load', () => {
        drawVendorIcon(ctx, size, color, image, vendorInitials[vendor], opacity);
        if (chart) {
            chart.update('none');
        }
    });

    iconCache.set(cacheKey, canvas);
    return canvas;
}

function hexToRgba(hex, alpha) {
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3
        ? normalized.split('').map((char) => char + char).join('')
        : normalized;
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function withAlpha(color, alpha) {
    if (color.startsWith('#')) {
        return hexToRgba(color, alpha);
    }
    if (color.startsWith('rgb')) {
        return color.replace(/rgba?\(([^)]+)\)/, (_, values) => {
            const [r, g, b] = values.split(',').map((value) => value.trim());
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        });
    }
    return color;
}

function getGoogleGradient(ctx, chartArea, alpha = 1) {
    if (!chartArea) {
        return withAlpha(vendorColors.google, alpha);
    }
    const gradient = ctx.createLinearGradient(chartArea.left, chartArea.top, chartArea.right, chartArea.bottom);
    gradient.addColorStop(0, `rgba(66, 133, 244, ${alpha})`);
    gradient.addColorStop(0.33, `rgba(52, 168, 83, ${alpha})`);
    gradient.addColorStop(0.66, `rgba(251, 188, 5, ${alpha})`);
    gradient.addColorStop(1, `rgba(234, 67, 53, ${alpha})`);
    return gradient;
}
