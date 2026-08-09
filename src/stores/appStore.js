import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const activeView = ref('dashboard')
  const isNightMode = ref(false)
  const notebookComposeRequest = ref(null)
  let viewChangeGuard = null

  async function requestView(nextView) {
    if (activeView.value === nextView) return true
    if (viewChangeGuard && !(await viewChangeGuard(nextView))) return false
    activeView.value = nextView
    return true
  }

  function registerViewChangeGuard(guard) {
    viewChangeGuard = guard
    return () => {
      if (viewChangeGuard === guard) viewChangeGuard = null
    }
  }

  function openMap() {
    return requestView('map')
  }

  function openShop() {
    return requestView('shop')
  }

  function openNotebook() {
    return requestView('notebook')
  }

  async function openEssayComposer(actionId = null) {
    if (!(await requestView('notebook'))) return false
    notebookComposeRequest.value = {
      token: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      actionId,
    }
    return true
  }

  function openDashboard() {
    return requestView('dashboard')
  }

  function openForest() {
    return requestView('forest')
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
    notebookComposeRequest.value = null
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
    notebookComposeRequest,
    openMap,
    openShop,
    openNotebook,
    openEssayComposer,
    registerViewChangeGuard,
    openDashboard,
    openForest,
    toggleNightMode,
    hydrateAppState,
    resetAppState,
    toAppSnapshot,
  }
})
