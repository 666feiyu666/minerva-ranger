import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { MAP_LOCATION_BY_ID, MAP_LOCATIONS } from '@/config/mapCatalog'
import { TREE_TYPES } from '@/config/treeCatalog'
import {
  MAP_SCALE_MAX,
  MAP_SCALE_MIN,
  createInitialMapState,
  getLocationRequirements,
  getLocationStatus,
  normalizeMapState,
  normalizeTreeCounts,
  unlockMapLocation,
  validateMapCatalog,
} from '@/local-backend/domain/mapModel'
import { useActionStore } from './actionStore'

const EMPTY_PERSISTENCE_ADAPTER = Object.freeze({ persist: () => true })

const createHistoricalLocation = (id, record) => ({
  id,
  name: record.locationNameSnapshot || '历史地点',
  region: '旧地图档案',
  summary: '此地点已从当前地图目录移除，解锁记录仍被保留。',
  description: record.descriptionSnapshot || '',
  sceneAlt: record.sceneAltSnapshot || '历史地点场景占位图',
  accent: record.accentSnapshot || '#71856b',
  sceneImage: null,
  status: 'unlocked',
  unlockRecord: record,
  historical: true,
  requirementsProgress: [],
})

export const useMapStore = defineStore('map', () => {
  const actionStore = useActionStore()
  const mapState = ref(createInitialMapState(MAP_LOCATIONS))
  let persistenceAdapter = EMPTY_PERSISTENCE_ADAPTER

  const catalogValidation = validateMapCatalog(MAP_LOCATIONS)
  if (import.meta.env.DEV && !catalogValidation.ok) {
    console.error('Map catalog validation failed.', catalogValidation.errors)
  }

  const availableTrees = computed(() => mapState.value.availableTrees)
  const selectedLocation = computed(() => {
    const locationId = mapState.value.selectedLocationId
    if (MAP_LOCATION_BY_ID[locationId]) return MAP_LOCATION_BY_ID[locationId]
    const historicalRecord = mapState.value.unlockedLocations[locationId]
    if (historicalRecord) return createHistoricalLocation(locationId, historicalRecord)
    return MAP_LOCATIONS[0] || null
  })
  const locationsWithState = computed(() =>
    MAP_LOCATIONS.map((location) => ({
      ...location,
      status: getLocationStatus(location, mapState.value),
      requirementsProgress: getLocationRequirements(location, availableTrees.value),
      unlockRecord: mapState.value.unlockedLocations[location.id] || null,
    })),
  )
  const selectedLocationState = computed(
    () =>
      locationsWithState.value.find((location) => location.id === selectedLocation.value?.id) ||
      (selectedLocation.value?.historical ? selectedLocation.value : null) ||
      null,
  )
  const unlockedCount = computed(
    () =>
      MAP_LOCATIONS.filter((location) => Boolean(mapState.value.unlockedLocations[location.id]))
        .length,
  )
  const totalAvailableTrees = computed(() =>
    Object.values(availableTrees.value).reduce((sum, count) => sum + (Number(count) || 0), 0),
  )
  const cumulativeTrees = computed(() => {
    const totals = {}
    for (const action of actionStore.actions) {
      for (const [treeId, count] of Object.entries(action.forest || {})) {
        totals[treeId] = (totals[treeId] || 0) + Math.max(0, Number(count) || 0)
      }
    }
    return totals
  })
  const treeResources = computed(() =>
    TREE_TYPES.map((tree) => ({
      ...tree,
      available: availableTrees.value[tree.id] || 0,
      cumulative: cumulativeTrees.value[tree.id] || 0,
    })),
  )
  const galleryLocations = computed(() => {
    const currentLocations = locationsWithState.value
      .filter((location) => location.status === 'unlocked')
      .sort((left, right) => {
        const leftTime = Date.parse(left.unlockRecord?.unlockedAt || 0) || 0
        const rightTime = Date.parse(right.unlockRecord?.unlockedAt || 0) || 0
        return rightTime - leftTime || left.order - right.order
      })
    const knownIds = new Set(MAP_LOCATIONS.map((location) => location.id))
    const historicalLocations = Object.entries(mapState.value.unlockedLocations)
      .filter(([locationId]) => !knownIds.has(locationId))
      .map(([id, record]) => createHistoricalLocation(id, record))
    return [...currentLocations, ...historicalLocations]
  })

  function configurePersistenceAdapter(adapter = {}) {
    persistenceAdapter = { persist: adapter.persist || EMPTY_PERSISTENCE_ADAPTER.persist }
  }

  function commitPersistedState(nextMapState) {
    const previousMapState = mapState.value
    mapState.value = nextMapState
    if (persistenceAdapter.persist() === false) {
      mapState.value = previousMapState
      return false
    }
    return true
  }

  function addTreeBalance(treeId, amount) {
    const count = Math.max(0, Math.floor(Number(amount) || 0))
    if (!treeId || count <= 0) return false
    mapState.value.availableTrees = {
      ...mapState.value.availableTrees,
      [treeId]: (mapState.value.availableTrees[treeId] || 0) + count,
    }
    return true
  }

  function unlockLocation(locationId) {
    const result = unlockMapLocation({
      mapState: mapState.value,
      locationId,
      locations: MAP_LOCATIONS,
    })
    if (!result.ok || result.alreadyUnlocked) return result
    if (!commitPersistedState(result.mapState)) return { ok: false, error: 'save_failed' }
    return result
  }

  function associateLocationSkill(locationId, skillId = null) {
    const record = mapState.value.unlockedLocations[locationId]
    if (!record) return { ok: false, error: 'location_locked' }
    const skill = skillId ? actionStore.skills.find((item) => item.id === skillId) : null
    if (skillId && !skill) return { ok: false, error: 'skill_missing' }
    const nextMapState = {
      ...mapState.value,
      unlockedLocations: {
        ...mapState.value.unlockedLocations,
        [locationId]: {
          ...record,
          skillId: skill?.id || null,
          skillNameSnapshot: skill?.name || null,
        },
      },
    }
    return commitPersistedState(nextMapState) ? { ok: true } : { ok: false, error: 'save_failed' }
  }

  function handleSkillDeleted(skill) {
    if (!skill?.id) return false
    let changed = false
    const unlockedLocations = Object.fromEntries(
      Object.entries(mapState.value.unlockedLocations).map(([locationId, record]) => {
        if (record.skillId !== skill.id) return [locationId, record]
        changed = true
        return [
          locationId,
          { ...record, skillId: null, skillNameSnapshot: skill.name || record.skillNameSnapshot },
        ]
      }),
    )
    if (changed) mapState.value.unlockedLocations = unlockedLocations
    return changed
  }

  function selectLocation(locationId) {
    if (!MAP_LOCATION_BY_ID[locationId] && !mapState.value.unlockedLocations[locationId]) {
      return false
    }
    mapState.value.selectedLocationId = locationId
    return true
  }

  function setViewport(viewport = {}) {
    mapState.value.viewport = {
      x: Number.isFinite(Number(viewport.x)) ? Number(viewport.x) : 0,
      y: Number.isFinite(Number(viewport.y)) ? Number(viewport.y) : 0,
      scale: Math.min(
        MAP_SCALE_MAX,
        Math.max(MAP_SCALE_MIN, Number(viewport.scale) || mapState.value.viewport.scale || 1),
      ),
    }
  }

  function resetViewport() {
    setViewport({ x: 0, y: 0, scale: 1 })
  }

  function hydrateMapState(data = {}) {
    mapState.value = normalizeMapState({
      mapData: data.map,
      actions: data.actions,
      locations: MAP_LOCATIONS,
      now: data.timestamp || Date.now(),
    })
  }

  function resetMapState() {
    mapState.value = createInitialMapState(MAP_LOCATIONS)
  }

  function replaceMapState(nextState) {
    mapState.value = normalizeMapState({
      mapData: { ...nextState, version: nextState?.version || 1 },
      actions: actionStore.actions,
      locations: MAP_LOCATIONS,
    })
  }

  function toMapSnapshot() {
    return {
      map: {
        ...mapState.value,
        availableTrees: normalizeTreeCounts(mapState.value.availableTrees),
      },
    }
  }

  return {
    mapState,
    availableTrees,
    selectedLocation,
    selectedLocationState,
    locationsWithState,
    unlockedCount,
    totalAvailableTrees,
    cumulativeTrees,
    treeResources,
    galleryLocations,
    MAP_LOCATIONS,
    addTreeBalance,
    unlockLocation,
    associateLocationSkill,
    handleSkillDeleted,
    selectLocation,
    setViewport,
    resetViewport,
    hydrateMapState,
    resetMapState,
    replaceMapState,
    toMapSnapshot,
    configurePersistenceAdapter,
  }
})
