import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { alertDialog } from '@/composables/dialogService'
import { CLOUD_SYNC_ENABLED } from '@/config/featureFlags'
import { buildSaveSummary } from '@/local-backend/domain/saveSchema'
import {
  clearStoredSession,
  deleteSlot as deleteSelfHostedCloudSlot,
  getStoredSession,
  listSlots as listSelfHostedCloudSlots,
  login as loginSelfHosted,
  register as registerSelfHosted,
  upsertSlot as upsertSelfHostedCloudSlot,
} from '@/cloud-backend/selfHostedSyncApi'
import { useSaveStore } from './saveStore'

export const useSyncStore = defineStore('sync', () => {
  const saveStore = useSaveStore()
  const user = ref(null)
  const syncStatus = ref('idle')
  const isCloudSyncEnabled = CLOUD_SYNC_ENABLED
  let cloudSyncTimeout = null

  async function pushSlotToCloud(slotId) {
    if (!isCloudSyncEnabled || !user.value || !slotId) return false
    const slot = saveStore.saveSlots.find((item) => item.id === slotId)
    const saveData = saveStore.readLocalSlot(slotId)
    if (!slot || !saveData) return false

    await upsertSelfHostedCloudSlot(slotId, {
      name: slot.name || saveData.slotName || 'Untitled Save',
      saveData: {
        ...saveData,
        slotId,
        slotName: slot.name || saveData.slotName,
      },
      summary: buildSaveSummary(saveData),
      clientUpdatedAt: slot.updatedAt || new Date(saveData.timestamp || Date.now()).toISOString(),
    })
    return true
  }

  function scheduleSlotCloudSync(slotId) {
    if (!isCloudSyncEnabled || !user.value || !slotId) return
    if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout)
    cloudSyncTimeout = setTimeout(() => {
      void pushSlotToCloud(slotId).catch((error) => console.error(error))
    }, 5000)
  }

  async function mergeSelfHostedCloudSlots() {
    if (!isCloudSyncEnabled) return 0
    syncStatus.value = 'syncing'
    const cloudSlots = await listSelfHostedCloudSlots()

    for (const cloudSlot of cloudSlots) {
      const cloudSaveData = {
        ...cloudSlot.saveData,
        slotId: cloudSlot.slotId,
        slotName: cloudSlot.name || cloudSlot.saveData?.slotName,
      }
      const localSlot = saveStore.saveSlots.find((slot) => slot.id === cloudSlot.slotId)

      if (!localSlot) {
        saveStore.persistCloudSlot(cloudSlot.slotId, cloudSaveData, {
          markPlayed: false,
          slotName: cloudSaveData.slotName,
        })
        saveStore.updateSlotMeta(cloudSlot.slotId, {
          source: 'cloud',
          updatedAt: cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt,
          lastPlayedAt: cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt,
        })
        continue
      }

      const localTime = Date.parse(localSlot.updatedAt || localSlot.lastPlayedAt || 0)
      const cloudTime = Date.parse(cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt || 0)
      if (cloudTime > localTime) {
        saveStore.persistCloudSlot(cloudSlot.slotId, cloudSaveData, {
          markPlayed: false,
          slotName: cloudSaveData.slotName,
        })
        saveStore.updateSlotMeta(cloudSlot.slotId, {
          source: 'cloud',
          updatedAt: cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt,
          lastPlayedAt: cloudSlot.clientUpdatedAt || cloudSlot.serverUpdatedAt,
        })
      } else if (localTime > cloudTime) {
        await pushSlotToCloud(localSlot.id)
      }
    }

    saveStore.saveSaveIndex()
    syncStatus.value = 'idle'
    return cloudSlots.length
  }

  async function initAuth() {
    if (!isCloudSyncEnabled) {
      user.value = null
      return
    }
    user.value = getStoredSession()?.user || null
  }

  async function loginWithEmail(email, password) {
    if (!isCloudSyncEnabled) return false
    try {
      const session = await loginSelfHosted(email, password)
      user.value = session.user
      await mergeSelfHostedCloudSlots()
      return true
    } catch (error) {
      void alertDialog('Login failed: ' + error.message, { title: 'Login failed' })
      return false
    }
  }

  async function registerWithEmail(email, password) {
    if (!isCloudSyncEnabled) return false
    try {
      const session = await registerSelfHosted(email, password)
      user.value = session.user
      await uploadSaveToCloud({ silent: true })
      void alertDialog('Account created and signed in.', { title: 'Sign up complete' })
      return true
    } catch (error) {
      void alertDialog('Sign up failed: ' + error.message, { title: 'Sign up failed' })
      return false
    }
  }

  async function logout() {
    clearStoredSession()
    user.value = null
  }

  async function uploadSaveToCloud(options = {}) {
    if (!isCloudSyncEnabled) return false
    if (!user.value) {
      void alertDialog('Please sign in first.', { title: 'Not signed in' })
      return false
    }
    try {
      syncStatus.value = 'syncing'
      if (saveStore.activeSlotId) saveStore.saveActiveSlot(false)
      let uploadedCount = 0
      for (const slot of saveStore.saveSlots) {
        if (await pushSlotToCloud(slot.id)) uploadedCount += 1
      }
      syncStatus.value = 'idle'
      if (!options.silent) {
        void alertDialog(`Synced ${uploadedCount} save slot(s).`, { title: 'Sync complete' })
      }
      return true
    } catch (error) {
      syncStatus.value = 'error'
      console.error(error)
      if (!options.silent) {
        void alertDialog('Cloud save failed: ' + error.message, { title: 'Sync failed' })
      }
      return false
    }
  }

  async function downloadSaveFromCloud(options = {}) {
    if (!isCloudSyncEnabled) return false
    if (!user.value) {
      void alertDialog('Please sign in first.', { title: 'Not signed in' })
      return false
    }
    try {
      const count = await mergeSelfHostedCloudSlots()
      if (!options.silent) {
        void alertDialog(`Pulled ${count} cloud save slot(s).`, { title: 'Sync complete' })
      }
      return true
    } catch (error) {
      syncStatus.value = 'error'
      console.error(error)
      if (!options.silent) {
        void alertDialog('Cloud load failed: ' + error.message, { title: 'Load failed' })
      }
      return false
    }
  }

  watch(
    () => saveStore.lastMutation?.revision,
    () => {
      const mutation = saveStore.lastMutation
      if (!mutation || !isCloudSyncEnabled || !user.value) return
      if (mutation.type === 'delete') {
        void deleteSelfHostedCloudSlot(mutation.slotId).catch((error) => console.error(error))
      } else if (mutation.sync === 'immediate') {
        void pushSlotToCloud(mutation.slotId).catch((error) => console.error(error))
      } else if (mutation.sync === 'debounced') {
        scheduleSlotCloudSync(mutation.slotId)
      }
    },
  )

  return {
    user,
    syncStatus,
    isCloudSyncEnabled,
    initAuth,
    loginWithEmail,
    registerWithEmail,
    logout,
    uploadSaveToCloud,
    downloadSaveFromCloud,
    pushSlotToCloud,
  }
})
