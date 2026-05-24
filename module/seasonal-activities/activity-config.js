const warnedUnknownActivities = new Set();
const LEGACY_ACTIVITY_TYPE_MAP = {
  itemInvestigation: "investigateItem"
};

function getGenericActivityMap() {
  return CONFIG?.ARM5E?.activities?.generic ?? {};
}

export function normalizeActivityType(activityType) {
  return LEGACY_ACTIVITY_TYPE_MAP[activityType] ?? activityType;
}

function normalizeActivityKey(activityType) {
  const generic = getGenericActivityMap();
  const normalizedType = normalizeActivityType(activityType);

  if (normalizedType in generic) {
    return normalizedType;
  }

  if (!warnedUnknownActivities.has(normalizedType)) {
    warnedUnknownActivities.add(normalizedType);
    console.warn(`[arm5e] Unknown activity type: ${normalizedType}`);
  }

  return "none";
}

export function getActivityDefinition(activityType) {
  const generic = getGenericActivityMap();
  const key = normalizeActivityKey(activityType);
  return generic[key] ?? generic.none ?? {};
}

export function getAllActivityDefinitions() {
  return getGenericActivityMap();
}

export function getSelectableActivityDefinitions() {
  return Object.entries(getGenericActivityMap()).filter(
    ([, definition]) => definition?.display?.attribute === undefined
  );
}

export function buildConflictExclusionTypes() {
  return Object.entries(getGenericActivityMap())
    .filter(([, definition]) => definition?.scheduling?.conflict === false)
    .map(([activityType]) => activityType);
}

export function buildDuplicateAllowedTypes() {
  return Object.entries(getGenericActivityMap())
    .filter(([, definition]) => definition?.scheduling?.duplicate === true)
    .map(([activityType]) => activityType);
}
