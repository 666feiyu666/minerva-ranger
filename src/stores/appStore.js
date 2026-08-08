import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const activeView = ref('dashboard')
  const isNightMode = ref(false)

  function openMap() {
    activeView.value = 'map'
  }

  function openShop() {
    activeView.value = 'shop'
  }

  function openNotebook() {
    activeView.value = 'notebook'
  }

  function openDashboard() {
    activeView.value = 'dashboard'
  }

  function openForest() {
    activeView.value = 'forest'
  }

  function toggleNightMode() {
    isNightMode.value = !isNightMode.value
  }

  function hydrateAppState(data = {}) {
    activeView.value = data.activeView || (data.activeActionId ? 'dashboard' : 'forest')
    isNightMode.value = data.isNightMode || false
  }

  function resetAppState() {
    activeView.value = 'forest'
    isNightMode.value = false
  }

  function toAppSnapshot() {
    return {
      activeView: activeView.value,
      isNightMode: isNightMode.value,
    }
  }

  return {
    activeView,
    isNightMode,
    openMap,
    openShop,
    openNotebook,
    openDashboard,
    openForest,
    toggleNightMode,
    hydrateAppState,
    resetAppState,
    toAppSnapshot,
  }
})
