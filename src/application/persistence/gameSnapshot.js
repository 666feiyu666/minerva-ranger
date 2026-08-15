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

  function createGameSnapshot({ activeSlotId, activeSlotName }) {
    return buildSaveData({
      activeSlotId,
      activeSlotName,
      ...playerStore.toPlayerSnapshot(),
      ...actionStore.toActionSnapshot(),
      ...notebookStore.toNotebookSnapshot(),
      ...mapStore.toMapSnapshot(),
      ...appStore.toAppSnapshot(),
      ...plantingStore.toPlantingSnapshot(),
    })
  }

  function hydrateGameSnapshot(data) {
    plantingStore.stopTimer()
    playerStore.hydratePlayerState(data)
    actionStore.hydrateActionState(data)
    notebookStore.hydrateNotebookState(data)
    mapStore.hydrateMapState(data)
    appStore.hydrateAppState(data)
    plantingStore.hydratePlantingState(data)
  }

  function resetGameSnapshot() {
    plantingStore.resetPlantingState()
    playerStore.resetPlayerState()
    actionStore.resetActionState()
    notebookStore.resetNotebookState()
    mapStore.resetMapState()
    appStore.resetAppState()
  }

  return {
    createGameSnapshot,
    hydrateGameSnapshot,
    resetGameSnapshot,
  }
}
