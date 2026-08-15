export const MAP_DATA_VERSION = 1
export const MAP_SCALE_MIN = 0.85
export const MAP_SCALE_MAX = 2.2

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

const toNonNegativeInteger = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0
}

export function normalizeTreeCounts(counts = {}) {
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return {}
  return Object.fromEntries(
    Object.entries(counts).map(([treeId, count]) => [treeId, toNonNegativeInteger(count)]),
  )
}

export function collectForestTreeCounts(actions = []) {
  return (Array.isArray(actions) ? actions : []).reduce((totals, action) => {
    for (const [treeId, count] of Object.entries(action?.forest || {})) {
      totals[treeId] = (totals[treeId] || 0) + toNonNegativeInteger(count)
    }
    return totals
  }, {})
}

export function areLocationPrerequisitesSatisfied(location, unlockedLocations = {}) {
  const prerequisites = location?.prerequisites || []
  if (prerequisites.length === 0) return true
  if (location.prerequisiteMode === 'all') {
    return prerequisites.every((locationId) => Boolean(unlockedLocations[locationId]))
  }
  return prerequisites.some((locationId) => Boolean(unlockedLocations[locationId]))
}

function createLocationSnapshot(location, unlockedAt) {
  return {
    unlockedAt,
    recipeSnapshot: normalizeTreeCounts(location.requirements),
    locationNameSnapshot: location.name,
    descriptionSnapshot: location.description,
    sceneAltSnapshot: location.sceneAlt,
    accentSnapshot: location.accent,
    skillId: null,
    skillNameSnapshot: null,
  }
}

function defaultUnlockedRecords(locations, unlockedAt) {
  return Object.fromEntries(
    locations
      .filter((location) => location.defaultUnlocked)
      .map((location) => [location.id, createLocationSnapshot(location, unlockedAt)]),
  )
}

export function getDiscoverableLocationIds(locations, unlockedLocations) {
  const discoverable = new Set(Object.keys(unlockedLocations || {}))
  for (const location of locations) {
    if (location.defaultUnlocked) discoverable.add(location.id)
    if (areLocationPrerequisitesSatisfied(location, unlockedLocations)) {
      discoverable.add(location.id)
    }
  }
  return [...discoverable]
}

export function createInitialMapState(locations, now = Date.now()) {
  const unlockedAt = new Date(now).toISOString()
  const unlockedLocations = defaultUnlockedRecords(locations, unlockedAt)
  return {
    version: MAP_DATA_VERSION,
    availableTrees: {},
    unlockedLocations,
    discoveredLocationIds: getDiscoverableLocationIds(locations, unlockedLocations),
    selectedLocationId:
      locations.find((location) => location.defaultUnlocked)?.id || locations[0]?.id || null,
    viewport: { x: 0, y: 0, scale: 1 },
    migratedFromLegacy: false,
  }
}

function normalizeUnlockedLocations(unlockedLocations, locations, fallbackUnlockedAt) {
  const catalogById = Object.fromEntries(locations.map((location) => [location.id, location]))
  const source = Array.isArray(unlockedLocations)
    ? Object.fromEntries(unlockedLocations.map((locationId) => [locationId, {}]))
    : unlockedLocations && typeof unlockedLocations === 'object'
      ? unlockedLocations
      : {}

  const normalized = {}
  for (const [locationId, rawRecord] of Object.entries(source)) {
    if (rawRecord === false || rawRecord === null) continue
    const record = rawRecord && typeof rawRecord === 'object' ? rawRecord : {}
    const location = catalogById[locationId]
    normalized[locationId] = {
      unlockedAt: record.unlockedAt || fallbackUnlockedAt,
      recipeSnapshot: normalizeTreeCounts(record.recipeSnapshot || location?.requirements || {}),
      locationNameSnapshot: record.locationNameSnapshot || location?.name || locationId,
      descriptionSnapshot: record.descriptionSnapshot || location?.description || '',
      sceneAltSnapshot: record.sceneAltSnapshot || location?.sceneAlt || '',
      accentSnapshot: record.accentSnapshot || location?.accent || '#71856b',
      skillId: record.skillId || null,
      skillNameSnapshot: record.skillNameSnapshot || null,
    }
  }
  return normalized
}

export function normalizeMapState({ mapData, actions = [], locations, now = Date.now() }) {
  const fallbackUnlockedAt = new Date(now).toISOString()
  if (!mapData || Number(mapData.version) < MAP_DATA_VERSION) {
    const migrated = createInitialMapState(locations, now)
    migrated.availableTrees = collectForestTreeCounts(actions)
    migrated.migratedFromLegacy = true
    return migrated
  }

  const unlockedLocations = normalizeUnlockedLocations(
    mapData.unlockedLocations,
    locations,
    fallbackUnlockedAt,
  )
  for (const [locationId, record] of Object.entries(
    defaultUnlockedRecords(locations, fallbackUnlockedAt),
  )) {
    if (!unlockedLocations[locationId]) unlockedLocations[locationId] = record
  }

  const knownIds = new Set(locations.map((location) => location.id))
  const discoveredLocationIds = new Set(
    (Array.isArray(mapData.discoveredLocationIds) ? mapData.discoveredLocationIds : []).filter(
      (locationId) => knownIds.has(locationId),
    ),
  )
  for (const locationId of getDiscoverableLocationIds(locations, unlockedLocations)) {
    discoveredLocationIds.add(locationId)
  }

  const selectedLocationId = knownIds.has(mapData.selectedLocationId)
    ? mapData.selectedLocationId
    : locations.find((location) => unlockedLocations[location.id])?.id || locations[0]?.id || null
  const viewport = mapData.viewport || {}

  return {
    version: MAP_DATA_VERSION,
    availableTrees: normalizeTreeCounts(mapData.availableTrees),
    unlockedLocations,
    discoveredLocationIds: [...discoveredLocationIds],
    selectedLocationId,
    viewport: {
      x: Number.isFinite(Number(viewport.x)) ? Number(viewport.x) : 0,
      y: Number.isFinite(Number(viewport.y)) ? Number(viewport.y) : 0,
      scale: clamp(Number(viewport.scale) || 1, MAP_SCALE_MIN, MAP_SCALE_MAX),
    },
    migratedFromLegacy: Boolean(mapData.migratedFromLegacy),
  }
}

export function getLocationRequirements(location, availableTrees = {}) {
  return Object.entries(location?.requirements || {}).map(([treeId, required]) => {
    const requiredCount = toNonNegativeInteger(required)
    const availableCount = toNonNegativeInteger(availableTrees[treeId])
    return {
      treeId,
      required: requiredCount,
      available: availableCount,
      missing: Math.max(0, requiredCount - availableCount),
      met: availableCount >= requiredCount,
    }
  })
}

export function getLocationStatus(location, mapState) {
  if (mapState.unlockedLocations?.[location.id]) return 'unlocked'
  if (!mapState.discoveredLocationIds?.includes(location.id)) return 'undiscovered'
  const requirements = getLocationRequirements(location, mapState.availableTrees)
  return requirements.every((requirement) => requirement.met) ? 'ready' : 'discovered'
}

export function unlockMapLocation({ mapState, locationId, locations, now = Date.now() }) {
  const location = locations.find((candidate) => candidate.id === locationId)
  if (!location) return { ok: false, error: 'location_missing' }
  if (mapState.unlockedLocations?.[locationId]) {
    return { ok: true, alreadyUnlocked: true, mapState }
  }
  if (!mapState.discoveredLocationIds?.includes(locationId)) {
    return { ok: false, error: 'location_undiscovered' }
  }
  if (!areLocationPrerequisitesSatisfied(location, mapState.unlockedLocations)) {
    return { ok: false, error: 'prerequisite_missing' }
  }

  const requirements = getLocationRequirements(location, mapState.availableTrees)
  if (requirements.some((requirement) => !requirement.met)) {
    return { ok: false, error: 'insufficient_trees', requirements }
  }

  const availableTrees = { ...mapState.availableTrees }
  for (const requirement of requirements) {
    availableTrees[requirement.treeId] -= requirement.required
  }

  const unlockedLocations = {
    ...mapState.unlockedLocations,
    [locationId]: createLocationSnapshot(location, new Date(now).toISOString()),
  }
  const discoveredLocationIds = new Set(mapState.discoveredLocationIds || [])
  discoveredLocationIds.add(locationId)
  for (const discoverableId of getDiscoverableLocationIds(locations, unlockedLocations)) {
    discoveredLocationIds.add(discoverableId)
  }

  return {
    ok: true,
    alreadyUnlocked: false,
    newlyDiscoveredLocationIds: [...discoveredLocationIds].filter(
      (id) => !mapState.discoveredLocationIds?.includes(id),
    ),
    mapState: {
      ...mapState,
      availableTrees,
      unlockedLocations,
      discoveredLocationIds: [...discoveredLocationIds],
      selectedLocationId: locationId,
    },
  }
}

export function validateMapCatalog(locations) {
  const errors = []
  const ids = new Set()
  for (const location of locations) {
    if (!location.id || ids.has(location.id)) errors.push(`地点 ID 无效或重复：${location.id}`)
    ids.add(location.id)
    if (!Number.isFinite(location.x) || !Number.isFinite(location.y)) {
      errors.push(`地点坐标无效：${location.id}`)
    }
    if (location.x < 0 || location.x > 100 || location.y < 0 || location.y > 100) {
      errors.push(`地点坐标越界：${location.id}`)
    }
  }
  if (!locations.some((location) => location.defaultUnlocked)) {
    errors.push('地图至少需要一个默认解锁地点。')
  }
  for (const location of locations) {
    for (const relatedId of [...(location.prerequisites || []), ...(location.adjacent || [])]) {
      if (!ids.has(relatedId)) errors.push(`地点 ${location.id} 引用了未知地点 ${relatedId}`)
    }
  }

  const visiting = new Set()
  const visited = new Set()
  const byId = Object.fromEntries(locations.map((location) => [location.id, location]))
  const visit = (locationId) => {
    if (visiting.has(locationId)) {
      errors.push(`地点前置关系形成循环：${locationId}`)
      return
    }
    if (visited.has(locationId)) return
    visiting.add(locationId)
    for (const prerequisiteId of byId[locationId]?.prerequisites || []) visit(prerequisiteId)
    visiting.delete(locationId)
    visited.add(locationId)
  }
  for (const location of locations) visit(location.id)
  return { ok: errors.length === 0, errors }
}
