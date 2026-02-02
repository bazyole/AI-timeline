// Configuration et données du benchmark
const rawData = [
    { model: "GPT-3.5", date: "2022-11-15", score: 923, vendor: "openai" },
    { model: "Mixtral 8×7B", date: "2023-12-15", score: 829, vendor: "mistral" },
    { model: "Mistral Large", date: "2024-02-15", score: 797, vendor: "mistral" },
    { model: "Llama 3", date: "2024-04-15", score: 894, vendor: "meta" },
    { model: "GPT-4o", date: "2024-05-13", score: 1137, vendor: "openai" },
    { model: "Claude 3.5 Sonnet", date: "2024-06-20", score: 1082, vendor: "anthropic" },
    { model: "Llama 3.1", date: "2024-07-15", score: 907, vendor: "meta" },
    { model: "Gemini 2.0 Flash", date: "2024-12-11", score: 1056, vendor: "google" },
    { model: "o1", date: "2024-12-15", score: 1081, vendor: "openai" },
    { model: "DeepSeek-V3", date: "2024-12-26", score: 1073, vendor: "deepseek" },
    { model: "DeepSeek-R1", date: "2025-01-20", score: 958, vendor: "deepseek" },
    { model: "Grok-3", date: "2025-02-15", score: 1151, vendor: "xai" },
    { model: "Claude 3.7 Sonnet", date: "2025-02-15", score: 1231, vendor: "anthropic" },
    { model: "QwQ-32B", date: "2025-03-15", score: 1064, vendor: "alibaba" },
    { model: "DeepSeek-V3-0324", date: "2025-03-24", score: 1129, vendor: "deepseek" },
    { model: "o3", date: "2025-04-16", score: 1075, vendor: "openai" },
    { model: "o4-mini-high", date: "2025-04-16", score: 1039, vendor: "openai" },
    { model: "GLM-4", date: "2025-04-15", score: 892, vendor: "zhipu" },
    { model: "Qwen3", date: "2025-04-28", score: 1282, vendor: "alibaba" },
    { model: "Claude Sonnet 4", date: "2025-05-15", score: 1203, vendor: "anthropic" },
    { model: "GPT-4.1", date: "2025-05-14", score: 1173, vendor: "openai" },
    { model: "o3-pro", date: "2025-06-15", score: 1148, vendor: "openai" },
    { model: "MiniMax-M1", date: "2025-06-17", score: 689, vendor: "minimax" },
    { model: "Gemini 2.5 Pro", date: "2025-06-17", score: 1228, vendor: "google" },
    { model: "Gemini 2.5 Flash", date: "2025-06-17", score: 1130, vendor: "google" },
    { model: "Grok-4", date: "2025-07-10", score: 1168, vendor: "xai" },
    { model: "Kimi K2", date: "2025-07-15", score: 1086, vendor: "moonshot" },
    { model: "GLM-4.5", date: "2025-07-28", score: 1114, vendor: "zhipu" },
    { model: "GPT-5", date: "2025-08-07", score: 1216, vendor: "openai" },
    { model: "DeepSeek-V3.1", date: "2025-08-21", score: 1100, vendor: "deepseek" },
    { model: "Qwen3 Next 80B", date: "2025-09-11", score: 1226, vendor: "alibaba" },
    { model: "Claude Sonnet 4.5", date: "2025-09-15", score: 1326, vendor: "anthropic" },
    { model: "GLM-4.6", date: "2025-09-15", score: 1243, vendor: "zhipu" },
    { model: "DeepSeek-V3.2-Exp", date: "2025-09-29", score: 1154, vendor: "deepseek" },
    { model: "Claude Haiku 4.5", date: "2025-10-15", score: 1308, vendor: "anthropic" },
    { model: "MiniMax-M2", date: "2025-10-23", score: 1226, vendor: "minimax" },
    { model: "GPT-5.1", date: "2025-11-12", score: 1413, vendor: "openai" },
    { model: "Claude Opus 4.5", date: "2025-11-15", score: 1431, vendor: "anthropic" },
    { model: "Gemini 3 Pro", date: "2025-11-18", score: 1395, vendor: "google" },
    { model: "Grok 4.1 Fast", date: "2025-11-18", score: 1246, vendor: "xai" },
    { model: "DeepSeek-V3.2", date: "2025-12-01", score: 1259, vendor: "deepseek" },
    { model: "GPT-5.2", date: "2025-12-11", score: 1368, vendor: "openai" },
    { model: "GLM-4.7", date: "2025-12-22", score: 1198, vendor: "zhipu" },
    { model: "Kimi K2.5", date: "2026-01-15", score: 1209, vendor: "moonshot" },
];

const vendorColors = {
    openai: "#ffffff",
    anthropic: "#f97316",
    google: "#4285f4",
    alibaba: "#8b5cf6",
    deepseek: "#2563eb",
    meta: "#0866ff",
    xai: "#374151",
    mistral: "#ef4444",
    zhipu: "#06b6d4",
    minimax: "#ec4899",
    moonshot: "#fbbf24"
};

const vendorNames = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    alibaba: "Qwen",
    deepseek: "DeepSeek",
    meta: "Meta",
    xai: "xAI",
    mistral: "Mistral",
    zhipu: "Zhipu",
    minimax: "MiniMax",
    moonshot: "Moonshot"
};

const vendorOrder = [
    "openai",
    "anthropic",
    "google",
    "xai",
    "alibaba",
    "deepseek",
    "moonshot",
    "zhipu",
    "minimax",
    "meta",
    "mistral"
];

const filterMap = {
    all: null,
    openai: ["openai"],
    anthropic: ["anthropic"],
    google: ["google"],
    alibaba: ["alibaba"],
    deepseek: ["deepseek"],
    meta: ["meta"],
    other: ["xai", "mistral", "zhipu", "minimax", "moonshot"]
};

// Variables globales
let chart;
let activeFilter = "all";
let hiddenVendors = new Set(["zhipu", "minimax", "meta", "mistral"]);
let autoYEnabled = true;

// Constantes
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const LABEL_RANGE_THRESHOLD_MS = 548 * ONE_DAY_MS;
const LINE_OPACITY = 0.55;
const SECONDARY_POINT_OPACITY = 0.55;
const LATEST_LABEL_OPACITY = 0.95;
const SECONDARY_LABEL_OPACITY = 0.55;

// Calcul de la date actuelle et des limites
const today = new Date();
today.setHours(0, 0, 0, 0);

const defaultYMin = 950;
const defaultYMax = 1450;

const dateExtent = rawData.reduce((acc, item) => {
    const date = new Date(item.date);
    if (!acc.min || date < acc.min) acc.min = date;
    if (!acc.max || date > acc.max) acc.max = date;
    return acc;
}, { min: null, max: null });

const defaultXMin = new Date(today.getTime() - 365 * ONE_DAY_MS);
const defaultXMax = new Date(today);
