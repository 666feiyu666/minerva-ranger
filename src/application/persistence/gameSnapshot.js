import { buildSaveData } from '@/local-backend/services/saveService'
import { useAppStore } from '@/stores/appStore'
import { useNotebookStore } from '@/stores/notebookStore'
import { useMapStore } from '@/stores/mapStore'
import { usePlantingStore } from '@/stores/plantingStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useActionStore } from '@/stores/actionStore'

export function useGameSnapshot() {
  const appStore = useAppStore()
  const playerStore = usePlayerStore()
  const actionStore = useActionStore()
  const notebookStore = useNotebookStore()
  const mapStore = useMapStore()
  const plantingStore = usePlantingStore()

  function createIdentitySnapshot({ activeSlotId, activeSlotName }) {
    return buildSaveData({
      activeSlotId,
      activeSlotName,
      ...actionStore.toActionSnapshot(),
      ...notebookStore.toNotebookSnapshot(),
      ...appStore.toAppSnapshot(),
      ...plantingStore.toPlantingSnapshot(),
    })
  }

  function createRangerSnapshot() {
    return {
      ...playerStore.toPlayerSnapshot(),
      ...mapStore.toMapSnapshot(),
    }
  }

  function hydrateIdentitySnapshot(data) {
    plantingStore.stopTimer()
    actionStore.hydrateActionState(data)
    notebookStore.hydrateNotebookState(data)
    appStore.hydrateAppState(data)
    plantingStore.hydratePlantingState(data)
  }

  function hydrateRangerSnapshot(data) {
    playerStore.hydratePlayerState(data)
    mapStore.hydrateMapState(data)
  }

  function resetIdentitySnapshot() {
    plantingStore.resetPlantingState()
    actionStore.resetActionState()
    notebookStore.resetNotebookState()
    appStore.resetAppState()
  }

  return {
    createIdentitySnapshot,
    createRangerSnapshot,
    hydrateIdentitySnapshot,
    hydrateRangerSnapshot,
    resetIdentitySnapshot,
  }
}
