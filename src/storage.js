import { normalizePlant } from "./calendar.js";
import { sampleLog, samplePlants } from "./sample-data.js";

const STORAGE_KEY = "garden-calendar-state-v6";
const LEGACY_KEYS = ["garden-calendar-state-v5", "garden-calendar-state-v4", "garden-calendar-state-v3", "garden-calendar-state-v2", "garden-calendar-state-v1"];

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return normalizeState(JSON.parse(raw));
    } catch {
      return createInitialState();
    }
  }

  for (const key of LEGACY_KEYS) {
    const legacyRaw = localStorage.getItem(key);
    if (!legacyRaw) continue;

    try {
      const legacy = JSON.parse(legacyRaw);
      return isBundledDemoState(legacy) ? createInitialState() : normalizeState(legacy);
    } catch {
      continue;
    }
  }

  return createInitialState();
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

function createInitialState() {
  return normalizeState({
    version: 1,
    plants: samplePlants,
    log: sampleLog,
  });
}

function normalizeState(state) {
  return {
    version: 1,
    plants: Array.isArray(state?.plants) ? state.plants.map(normalizePlant).filter((plant) => plant.name) : [],
    log: Array.isArray(state?.log) ? state.log : [],
  };
}

function isBundledDemoState(state) {
  const demoIds = new Set([
    "plant_petunia",
    "plant_catharanthus",
    "plant_begonia",
    "plant_tomato",
    "plant_pepper",
    "plant_cucumber",
    "plant_corn",
    "plant_tomato_pepper",
    "plant_strawberry",
    "plant_rose",
    "plant_basil",
  ]);
  const plants = Array.isArray(state?.plants) ? state.plants : [];
  return plants.length > 0 && plants.every((plant) => demoIds.has(plant.id));
}
