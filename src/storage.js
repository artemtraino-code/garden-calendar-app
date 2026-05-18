import {
  DEFAULT_INTERVALS,
  TASK_ICONS,
  TASK_LABELS,
  normalizePlant,
  normalizePreparation,
} from "./calendar.js";
import { sampleLog, samplePlants, samplePreparations } from "./sample-data.js";

const STORAGE_KEY = "garden-calendar-state-v11";
const LEGACY_KEYS = ["garden-calendar-state-v10", "garden-calendar-state-v9", "garden-calendar-state-v8", "garden-calendar-state-v7", "garden-calendar-state-v6", "garden-calendar-state-v5", "garden-calendar-state-v4", "garden-calendar-state-v3", "garden-calendar-state-v2", "garden-calendar-state-v1"];
const memoryStorage = new Map();

export function loadState() {
  const raw = readStorage(STORAGE_KEY);
  if (raw) {
    try {
      return normalizeState(JSON.parse(raw));
    } catch {
      return createInitialState();
    }
  }

  for (const key of LEGACY_KEYS) {
    const legacyRaw = readStorage(key);
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
  writeStorage(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

function readStorage(key) {
  try {
    return globalThis.localStorage?.getItem(key) || memoryStorage.get(key) || "";
  } catch {
    return memoryStorage.get(key) || "";
  }
}

function writeStorage(key, value) {
  memoryStorage.set(key, value);
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // In-app previews can block localStorage; the in-memory copy keeps the app usable.
  }
}

function createInitialState() {
  return normalizeState({
    version: 1,
    plants: samplePlants,
    preparations: samplePreparations,
    workTypes: defaultWorkTypes(),
    log: sampleLog,
  });
}

function normalizeState(state) {
  const hasPreparations = Array.isArray(state?.preparations);
  const hasPlants = Array.isArray(state?.plants);
  const samplePlantMap = new Map(
    samplePlants
      .map(normalizePlant)
      .filter((plant) => plant.name)
      .map((plant) => [plant.id, plant]),
  );
  const samplePreparationMap = new Map(
    samplePreparations
      .map(normalizePreparation)
      .filter((preparation) => preparation.name)
      .map((preparation) => [preparation.id, preparation]),
  );
  const plantMap = new Map();
  const preparationMap = new Map();

  if (hasPlants) {
    state.plants
      .map(normalizePlant)
      .filter((plant) => plant.name)
      .forEach((plant) => plantMap.set(plant.id, plant));
  }

  if (hasPreparations) {
    state.preparations
      .map(normalizePreparation)
      .filter((preparation) => preparation.name)
      .forEach((preparation) => preparationMap.set(preparation.id, preparation));
  }

  samplePlantMap.forEach((samplePlant, id) => {
    const existingPlant = plantMap.get(id);
    plantMap.set(id, existingPlant ? { ...samplePlant, ...existingPlant } : samplePlant);
  });

  samplePreparationMap.forEach((samplePreparation, id) => {
    const existingPreparation = preparationMap.get(id);
    preparationMap.set(id, existingPreparation ? { ...existingPreparation, ...samplePreparation } : samplePreparation);
  });

  return {
    version: 1,
    plants: [...plantMap.values()],
    preparations: [...preparationMap.values()],
    workTypes: Array.isArray(state?.workTypes) ? normalizeWorkTypes(state.workTypes) : defaultWorkTypes(),
    log: Array.isArray(state?.log) ? state.log : [],
  };
}

function defaultWorkTypes() {
  const iconMap = {
    plant: "seedling",
    water: "droplet",
    feed: "herb",
    treat: "bug",
    prune: "scissors",
    inspect: "magnifying-glass-tilted-left",
    harvest: "basket",
    repot: "potted-plant",
  };

  return Object.entries(TASK_LABELS).map(([id, label]) => ({
    id,
    label,
    icon: iconMap[id] || "spiral-calendar",
    interval: Number(DEFAULT_INTERVALS[id]?.other || 14),
  }));
}

function normalizeWorkTypes(workTypes) {
  return workTypes
    .map((workType) => ({
      id: String(workType?.id || "").trim(),
      label: String(workType?.label || workType?.name || "").trim(),
      icon: normalizeIconName(workType?.icon || TASK_ICONS[workType?.id] || "spiral-calendar"),
      interval: Number(workType?.interval || DEFAULT_INTERVALS[workType?.id]?.other || 14),
    }))
    .filter((workType) => workType.id && workType.label);
}

function normalizeIconName(icon) {
  const legacyMap = {
    "ti-plant": "seedling",
    "ti-plant-2": "seedling",
    "ti-droplet": "droplet",
    "ti-leaf": "herb",
    "ti-bug": "bug",
    "ti-scissors": "scissors",
    "ti-search": "magnifying-glass-tilted-left",
    "ti-basket": "basket",
    "ti-calendar": "spiral-calendar",
  };
  const value = String(icon || "").trim();
  return legacyMap[value] || value || "seedling";
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
