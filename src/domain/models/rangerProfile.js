import {
  collectForestTreeCounts,
  createInitialMapState,
  normalizeMapState,
  normalizeTreeCounts,
} from './mapModel.js'

export const RANGER_PROFILE_VERSION = 1

const uniqueStrings = (values, fallback = []) => {
  const source = Array.isArray(values) ? values : fallback
  return [...new Set(source.filter((value) => typeof value === 'string' && value))]
}

const toNonNegativeNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, number) : 0
}

const createProfileId = (now = Date.now()) =>
  `ranger_${now}_${Math.random().toString(36).slice(2, 8)}`

const addTreeCounts = (...countSets) => {
  const totals = {}
  for (const counts of countSets) {
    for (const [treeId, count] of Object.entries(normalizeTreeCounts(counts))) {
      totals[treeId] = (totals[treeId] || 0) + count
    }
  }
  return totals
}

const recordTime = (record) => Date.parse(record?.unlockedAt || '') || Number.MAX_SAFE_INTEGER

const mergeUnlockedLocations = (baseLocations = {}, incomingLocations = {}) => {
  const merged = { ...baseLocations }
  for (const [locationId, incomingRecord] of Object.entries(incomingLocations)) {
    const baseRecord = merged[locationId]
    if (!baseRecord || recordTime(incomingRecord) < recordTime(baseRecord)) {
      merged[locationId] = incomingRecord
    }
  }
  return merged
}

const refundDuplicateUnlocks = (baseMap, incomingMap) => {
  const refunds = {}
  for (const [locationId, incomingRecord] of Object.entries(incomingMap.unlockedLocations || {})) {
    if (!baseMap.unlockedLocations?.[locationId]) continue
    const recipe = incomingRecord.recipeSnapshot || {}
    for (const [treeId, count] of Object.entries(normalizeTreeCounts(recipe))) {
      refunds[treeId] = (refunds[treeId] || 0) + count
    }
  }
  return refunds
}

export function createInitialRangerProfile(locations, now = Date.now()) {
  return {
    version: RANGER_PROFILE_VERSION,
    profileId: createProfileId(now),
    migratedLegacySourceIds: [],
    mergedProfileIds: [],
    coins: 0,
    globalXP: 0,
    unlockedTreeIds: ['t1'],
    ownedBoostIds: [],
    unlockedBackgroundIds: ['background_default'],
    map: createInitialMapState(locations, now),
  }
}

export function normalizeRangerProfile(profile, locations, now = Date.now()) {
  const source = profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {}
  return {
    version: RANGER_PROFILE_VERSION,
    profileId: source.profileId || createProfileId(now),
    migratedLegacySourceIds: uniqueStrings(source.migratedLegacySourceIds),
    mergedProfileIds: uniqueStrings(source.mergedProfileIds),
    coins: toNonNegativeNumber(source.coins),
    globalXP: toNonNegativeNumber(source.globalXP),
    unlockedTreeIds: uniqueStrings([
      't1',
      ...(Array.isArray(source.unlockedTreeIds) ? source.unlockedTreeIds : []),
    ]),
    ownedBoostIds: uniqueStrings(source.ownedBoostIds),
    unlockedBackgroundIds: uniqueStrings([
      'background_default',
      ...(Array.isArray(source.unlockedBackgroundIds) ? source.unlockedBackgroundIds : []),
    ]),
    map: normalizeMapState({ mapData: source.map, locations, now }),
  }
}

export function legacySourceId(saveData = {}, fallbackId = null) {
  if (fallbackId) return `slot:${fallbackId}`
  if (saveData.slotId) return `slot:${saveData.slotId}`
  const actionIds = (Array.isArray(saveData.actions) ? saveData.actions : [])
    .map((action) => action?.id)
    .filter(Boolean)
    .sort()
    .join(',')
  return `legacy:${saveData.slotName || saveData.name || 'identity'}:${saveData.timestamp || 0}:${actionIds}`
}

export function hasLegacyRangerProgress(saveData = {}) {
  return [
    'coins',
    'globalXP',
    'unlockedTreeIds',
    'ownedBoostIds',
    'unlockedBackgroundIds',
    'map',
  ].some((field) => saveData[field] !== undefined)
}

function legacySaveToRangerProfile(saveData, locations, now = Date.now()) {
  const actions = Array.isArray(saveData.actions) ? saveData.actions : []
  const actionTreeCounts = collectForestTreeCounts(actions)
  const normalizedMap = saveData.map
    ? normalizeMapState({ mapData: saveData.map, actions, locations, now })
    : {
        ...createInitialMapState(locations, now),
        availableTrees: actionTreeCounts,
        cumulativeTrees: actionTreeCounts,
        migratedFromLegacy: true,
      }
  const hasCumulativeTrees = Object.values(normalizedMap.cumulativeTrees || {}).some(
    (count) => count > 0,
  )
  const map = hasCumulativeTrees
    ? normalizedMap
    : { ...normalizedMap, cumulativeTrees: actionTreeCounts }

  return normalizeRangerProfile(
    {
      coins: saveData.coins,
      globalXP: saveData.globalXP,
      unlockedTreeIds: saveData.unlockedTreeIds,
      ownedBoostIds: saveData.ownedBoostIds,
      unlockedBackgroundIds: saveData.unlockedBackgroundIds,
      map,
    },
    locations,
    now,
  )
}

function isInitialRangerProfile(profile, locations) {
  const defaultMap = createInitialMapState(locations, 0)
  const unlockedIds = Object.keys(profile.map?.unlockedLocations || {})
  const defaultUnlockedIds = Object.keys(defaultMap.unlockedLocations)
  return (
    profile.coins === 0 &&
    profile.globalXP === 0 &&
    profile.unlockedTreeIds.length === 1 &&
    profile.unlockedTreeIds[0] === 't1' &&
    profile.ownedBoostIds.length === 0 &&
    profile.unlockedBackgroundIds.length === 1 &&
    profile.unlockedBackgroundIds[0] === 'background_default' &&
    Object.values(profile.map?.availableTrees || {}).every((count) => count === 0) &&
    Object.values(profile.map?.cumulativeTrees || {}).every((count) => count === 0) &&
    unlockedIds.length === defaultUnlockedIds.length &&
    defaultUnlockedIds.every((locationId) => unlockedIds.includes(locationId))
  )
}

export function mergeRangerProfiles(currentProfile, incomingProfile, locations, now = Date.now()) {
  const current = normalizeRangerProfile(currentProfile, locations, now)
  const incoming = normalizeRangerProfile(incomingProfile, locations, now)
  if (
    incoming.profileId === current.profileId ||
    current.mergedProfileIds.includes(incoming.profileId)
  ) {
    return current
  }
  if (isInitialRangerProfile(current, locations)) return incoming

  const duplicateRefunds = refundDuplicateUnlocks(current.map, incoming.map)
  const mergedMap = normalizeMapState({
    mapData: {
      ...current.map,
      availableTrees: addTreeCounts(
        current.map.availableTrees,
        incoming.map.availableTrees,
        duplicateRefunds,
      ),
      cumulativeTrees: addTreeCounts(current.map.cumulativeTrees, incoming.map.cumulativeTrees),
      unlockedLocations: mergeUnlockedLocations(
        current.map.unlockedLocations,
        incoming.map.unlockedLocations,
      ),
      discoveredLocationIds: [
        ...(current.map.discoveredLocationIds || []),
        ...(incoming.map.discoveredLocationIds || []),
      ],
    },
    locations,
    now,
  })

  return normalizeRangerProfile(
    {
      ...current,
      coins: current.coins + incoming.coins,
      globalXP: current.globalXP + incoming.globalXP,
      unlockedTreeIds: [...current.unlockedTreeIds, ...incoming.unlockedTreeIds],
      ownedBoostIds: [...current.ownedBoostIds, ...incoming.ownedBoostIds],
      unlockedBackgroundIds: [...current.unlockedBackgroundIds, ...incoming.unlockedBackgroundIds],
      mergedProfileIds: [...current.mergedProfileIds, incoming.profileId],
      migratedLegacySourceIds: [
        ...current.migratedLegacySourceIds,
        ...incoming.migratedLegacySourceIds,
      ],
      map: mergedMap,
    },
    locations,
    now,
  )
}

export function mergeLegacySaveIntoRangerProfile(
  currentProfile,
  saveData,
  locations,
  sourceId = legacySourceId(saveData),
  now = Date.now(),
) {
  const current = normalizeRangerProfile(currentProfile, locations, now)
  if (!hasLegacyRangerProgress(saveData) || current.migratedLegacySourceIds.includes(sourceId)) {
    return current
  }

  const incoming = legacySaveToRangerProfile(saveData, locations, now)
  const merged = mergeRangerProfiles(
    current,
    { ...incoming, profileId: `legacy-profile:${sourceId}` },
    locations,
    now,
  )
  return normalizeRangerProfile(
    {
      ...merged,
      migratedLegacySourceIds: [...merged.migratedLegacySourceIds, sourceId],
    },
    locations,
    now,
  )
}

export function migrateLegacySlotsToRangerProfile(slotEntries, locations, now = Date.now()) {
  let profile = createInitialRangerProfile(locations, now)
  for (const entry of Array.isArray(slotEntries) ? slotEntries : []) {
    const saveData = entry?.saveData || entry
    if (!saveData || typeof saveData !== 'object') continue
    profile = mergeLegacySaveIntoRangerProfile(
      profile,
      saveData,
      locations,
      legacySourceId(saveData, entry?.slotId),
      now,
    )
  }
  return profile
}
