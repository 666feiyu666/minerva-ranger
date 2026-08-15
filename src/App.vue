<template>
  <div
    v-if="store.bootStage === 'initializing'"
    class="flex min-h-screen items-center justify-center p-8"
    style="background: var(--paper); color: var(--ink)"
  >
    <section class="paper-panel max-w-md px-10 py-12 text-center">
      <div class="paper-label">V0.4 本地存档</div>
      <h1 class="display-title mt-3 text-2xl">正在检查巡林官档案</h1>
      <p class="mt-3 text-sm leading-7" style="color: var(--ink-soft)">
        初始化 SQLite，并在需要时迁移旧版浏览器存档。此过程不会删除旧数据。
      </p>
    </section>
  </div>

  <div
    v-else-if="store.bootStage === 'persistence-error'"
    class="flex min-h-screen items-center justify-center p-8"
    style="background: var(--paper); color: var(--ink)"
  >
    <section class="paper-panel max-w-lg px-10 py-12 text-center">
      <div class="paper-label">本地存档不可用</div>
      <h1 class="display-title mt-3 text-2xl">没有继续写入，以保护现有数据</h1>
      <p class="mt-3 text-sm leading-7" style="color: var(--ink-soft)">
        {{ store.persistenceError?.message || 'SQLite 初始化失败，请重试。' }}
      </p>
      <button class="primary-button mt-5" type="button" @click="retryPersistence">
        重新检查
      </button>
      <button class="quiet-button ml-2 mt-5" type="button" @click="loadRecoveryBackups">
        查找本地备份
      </button>
      <div v-if="store.persistenceBackups.length" class="mt-5 space-y-2 text-left">
        <button
          v-for="backup in store.persistenceBackups"
          :key="backup.filename"
          class="quiet-button w-full"
          type="button"
          @click="restoreRecoveryBackup(backup)"
        >
          恢复 {{ new Date(backup.createdAt).toLocaleString('zh-CN', { hour12: false }) }} 的备份
        </button>
      </div>
    </section>
  </div>

  <SaveSlotSelectView v-else-if="store.bootStage === 'slot-select'" />

  <div v-else class="app-shell" :data-theme="store.isNightMode ? 'night' : 'day'">
    <Sidebar />

    <main class="app-workspace" :style="backgroundStyle">
      <header class="app-toolbar">
        <div class="app-toolbar__context">
          <div class="app-toolbar__eyebrow">
            {{ store.activeSlotMeta?.name || '未命名身份' }} · {{ currentViewEyebrow }}
          </div>
          <div class="app-toolbar__title">{{ currentViewTitle }}</div>
        </div>

        <div class="app-toolbar__actions">
          <div class="relative" data-utility-menu>
            <button
              class="app-icon-button"
              type="button"
              title="身份与设置"
              aria-label="身份与设置"
              @click="showUtilityMenu = !showUtilityMenu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"
                />
              </svg>
            </button>

            <div v-if="showUtilityMenu" class="app-utility-menu">
              <div class="paper-label">当前身份</div>
              <div class="mt-2 display-title text-lg">
                {{ store.activeSlotMeta?.name || '未命名身份' }}
              </div>
              <p class="mt-2 text-xs leading-5" style="color: var(--ink-soft)">
                巡林官全局进度与当前身份记录都保存在本设备。建议定期导出备份。
              </p>
              <div
                v-if="store.persistenceError"
                class="mt-3 rounded-lg border px-3 py-2 text-xs"
                style="border-color: var(--danger); color: var(--danger)"
              >
                本地保存异常：{{ store.persistenceError.action }}。请尽快导出当前身份的备份。
              </div>
              <button class="quiet-button mt-4 w-full" type="button" @click="handleExitToSlots">
                切换身份
              </button>
              <button
                v-if="store.persistenceMode === 'sqlite'"
                class="quiet-button mt-2 w-full"
                type="button"
                @click="handleCreateBackup"
              >
                创建数据库备份
              </button>
            </div>
          </div>

          <button
            class="app-icon-button"
            type="button"
            title="快速写随笔"
            aria-label="快速写随笔"
            @click="appStore.openEssayComposer()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M20 4c-5.5.2-9.6 2.3-12.3 6.2C5.9 12.8 5 15.7 5 20" />
              <path d="M7.8 16.2c2.7-.2 5.1-1 7.2-2.6M4 20h6" />
            </svg>
          </button>

          <button
            class="app-icon-button"
            type="button"
            :title="store.isNightMode ? '切换到日间图志' : '切换到夜间图志'"
            :aria-label="store.isNightMode ? '切换到日间图志' : '切换到夜间图志'"
            @click="store.toggleNightMode"
          >
            <svg
              v-if="store.isNightMode"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <circle cx="12" cy="12" r="4" />
              <path
                d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.6 8.6 0 1 0 20.4 15.2Z" />
            </svg>
          </button>
        </div>
      </header>

      <div class="app-content">
        <ShopView v-if="store.activeView === 'shop'" />
        <MapView v-else-if="store.activeView === 'map'" />
        <ForestView v-else-if="store.activeView === 'forest'" />
        <NotebookView v-else-if="store.activeView === 'notebook'" />
        <IdleDashboard v-else-if="store.activeView === 'dashboard' && store.activeActionId" />

        <div v-else class="flex flex-1 items-center justify-center p-8">
          <div class="paper-panel max-w-lg px-10 py-12 text-center">
            <div class="paper-label">尚未选择行动</div>
            <h2 class="display-title mt-3 text-2xl">从左侧目录选一条实践路径</h2>
            <p class="mt-3 text-sm leading-7" style="color: var(--ink-soft)">
              选择行动后，可以开始计时种植，让现实投入在这里留下可回望的树木与记录。
            </p>
          </div>
        </div>
      </div>

      <Transition name="fade">
        <div
          v-if="store.offlineEarnings"
          class="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <section class="paper-panel relative w-full max-w-md overflow-hidden p-6">
            <div class="paper-label">离线巡林记录</div>
            <h2 class="display-title mt-2 text-2xl">欢迎回来</h2>
            <p class="mt-2 text-sm" style="color: var(--ink-soft)">
              离开期间，当前行动继续记录了
              <strong style="color: var(--ink)">{{
                formatDuration(store.offlineEarnings.secondsPassed)
              }}</strong
              >。
            </p>
            <div
              class="mt-5 flex items-center gap-4 rounded-xl border p-4"
              style="border-color: var(--line)"
            >
              <img
                :src="store.offlineEarnings.tree.icon"
                class="pixel-art h-12 w-12 object-contain"
                alt=""
              />
              <div class="min-w-0 flex-1">
                <div class="display-title text-lg">{{ store.offlineEarnings.tree.name }}</div>
                <div class="mt-1 text-xs" style="color: var(--ink-soft)">
                  新完成 {{ store.offlineEarnings.completedCycles }} 个周期
                </div>
              </div>
              <div class="text-right text-xs" style="color: var(--ink-soft)">
                <div>当前状态</div>
                <strong class="mt-1 block" style="color: var(--forest)">
                  {{
                    store.offlineEarnings.newTimer >= store.taskLimit
                      ? '已到目标时长'
                      : '继续种植中'
                  }}
                </strong>
              </div>
            </div>
            <button
              class="primary-button mt-5 w-full"
              type="button"
              @click="handleClaimOfflineEarnings"
            >
              收下这段巡林进度
            </button>
          </section>
        </div>
      </Transition>
    </main>
  </div>

  <AppDialogHost />
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
import { alertDialog, confirmDialog } from '@/composables/dialogService'
import AppDialogHost from './components/AppDialogHost.vue'
import ForestView from './components/ForestView.vue'
import IdleDashboard from './components/IdleDashboard.vue'
import MapView from './components/MapView.vue'
import NotebookView from './components/NotebookView.vue'
import SaveSlotSelectView from './components/SaveSlotSelectView.vue'
import ShopView from './components/ShopView.vue'
import Sidebar from './components/Sidebar.vue'
import { useActionStore } from '@/stores/actionStore'
import { useAppStore } from '@/stores/appStore'
import { usePlantingStore } from '@/stores/plantingStore'
import { useSaveStore } from '@/stores/saveStore'
import bgDay from '@/assets/bg-day.png'
import bgNight from '@/assets/bg-night.png'

const appStore = useAppStore()
const plantingStore = usePlantingStore()
const actionStore = useActionStore()
const saveStore = useSaveStore()
const actionWorkflow = useActionWorkflow()
const store = reactive({
  ...storeToRefs(appStore),
  ...storeToRefs(plantingStore),
  ...storeToRefs(actionStore),
  ...storeToRefs(saveStore),
  PLANTING_MODES: plantingStore.PLANTING_MODES,
  claimOfflineEarnings: plantingStore.claimOfflineEarnings,
  exitToSaveSelection: saveStore.exitToSaveSelection,
  initSaveSystem: saveStore.initSaveSystem,
  flushPersistence: saveStore.flushPersistence,
  createPersistenceBackup: saveStore.createPersistenceBackup,
  loadPersistenceBackups: saveStore.loadPersistenceBackups,
  restorePersistenceBackup: saveStore.restorePersistenceBackup,
  openForest: actionWorkflow.openForest,
  openNotebook: appStore.openNotebook,
  openShop: appStore.openShop,
  toggleNightMode: appStore.toggleNightMode,
})

const showUtilityMenu = ref(false)
const SYSTEM_VIEWS = new Set(['shop', 'map', 'notebook'])
const viewMeta = {
  dashboard: { eyebrow: '行动', title: '行动仪表盘' },
  forest: { eyebrow: '生长记录', title: '森林巡视' },
  map: { eyebrow: '长期探索', title: '密涅瓦地图' },
  notebook: { eyebrow: '记忆与回望', title: '巡林笔记' },
  shop: { eyebrow: '树种与培育', title: '巡林苗圃' },
}

const currentViewEyebrow = computed(() => viewMeta[store.activeView]?.eyebrow || '巡林图志')
const currentViewTitle = computed(() => {
  if (store.activeView === 'dashboard' && store.activeAction?.name) return store.activeAction.name
  return viewMeta[store.activeView]?.title || '密涅瓦的巡林官'
})
const isSystemView = computed(() => SYSTEM_VIEWS.has(store.activeView))

onMounted(async () => {
  const ready = await store.initSaveSystem()
  if (ready) plantingStore.attachRuntime()
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  plantingStore.detachRuntime()
  document.removeEventListener('click', handleDocumentClick)
})

const backgroundStyle = computed(() => {
  if (isSystemView.value) {
    return {
      backgroundImage: store.isNightMode
        ? 'linear-gradient(135deg, rgba(18, 28, 21, .98), rgba(30, 39, 29, .96))'
        : 'linear-gradient(135deg, rgba(239, 235, 220, .98), rgba(225, 232, 214, .96))',
    }
  }
  if (store.activeView === 'forest') {
    return {
      backgroundImage: store.isNightMode
        ? 'linear-gradient(180deg, #1b1813 0%, #242019 100%)'
        : 'linear-gradient(180deg, #efe5d6 0%, #e3d5c1 100%)',
    }
  }
  const img = store.isNightMode ? bgNight : bgDay
  return {
    backgroundImage: `linear-gradient(180deg, rgba(22, 37, 29, .10), rgba(22, 37, 29, .38)), url(${img})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
  }
})

const handleDocumentClick = (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('[data-utility-menu]')) return
  showUtilityMenu.value = false
}

const retryPersistence = async () => {
  const ready = await store.initSaveSystem()
  if (ready) plantingStore.attachRuntime()
}

const loadRecoveryBackups = async () => {
  const backups = await store.loadPersistenceBackups()
  if (backups.length === 0) {
    await alertDialog('没有找到可用的 SQLite 备份。', { title: '本地恢复' })
  }
}

const restoreRecoveryBackup = async (backup) => {
  const confirmed = await confirmDialog(
    '恢复备份会先保留当前数据库文件，再切换到所选版本。是否继续？',
    { title: '恢复 SQLite 备份', confirmText: '恢复' },
  )
  if (!confirmed) return
  if (await store.restorePersistenceBackup(backup.filename)) {
    plantingStore.attachRuntime()
    await alertDialog('备份已恢复。', { title: '本地存档已恢复' })
  }
}

const handleCreateBackup = async () => {
  const backup = await store.createPersistenceBackup('manual')
  if (backup) {
    await alertDialog('数据库备份已创建。', { title: '本地备份' })
  }
}

const handleExitToSlots = async () => {
  showUtilityMenu.value = false
  store.exitToSaveSelection()
  await store.flushPersistence({ reloadOnFailure: true })
}

const handleClaimOfflineEarnings = async () => {
  store.claimOfflineEarnings()
  await store.flushPersistence({ reloadOnFailure: true })
}

const formatDuration = (seconds) => {
  if (!seconds) return '0 分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
