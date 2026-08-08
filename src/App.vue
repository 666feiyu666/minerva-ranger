<template>
  <SaveSlotSelectView v-if="store.bootStage === 'slot-select'" />

  <div
    v-else
    class="flex h-screen w-screen font-sans overflow-hidden transition-colors duration-500"
    :class="store.isNightMode ? 'bg-melvor-dark text-gray-200' : 'bg-gray-100 text-gray-900'"
  >
    <Sidebar class="hidden md:flex shadow-2xl z-20" />

    <Transition name="slide-fade">
      <div v-if="showMobileMenu" class="fixed inset-0 z-50 md:hidden flex">
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="showMobileMenu = false"
        ></div>

        <Sidebar class="relative h-full w-72 shadow-2xl" />

        <button
          @click="showMobileMenu = false"
          class="absolute top-4 left-[19rem] text-white bg-black/50 p-2 rounded-full"
        >
          ✕
        </button>
      </div>
    </Transition>

    <main
      class="flex-1 flex flex-col relative transition-all duration-500 ease-in-out bg-no-repeat bg-bottom overflow-hidden"
      :class="mainShellClass"
      :style="backgroundStyle"
      style="padding-top: var(--sat); padding-bottom: var(--sab)"
    >
      <button
        @click="showMobileMenu = true"
        class="md:hidden absolute top-4 left-4 z-40 p-2 rounded-full bg-white/30 border border-white/20 backdrop-blur-md shadow-lg active:scale-95 transition-all"
        :class="store.isNightMode ? 'text-white bg-black/30' : 'text-gray-800'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <div class="absolute top-4 right-4 z-40 flex items-start gap-2">
        <div class="relative">
          <button
            @click="showUtilityMenu = !showUtilityMenu"
            class="p-2 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 shadow-lg"
          >
            <span class="text-xl">⚙️</span>
          </button>

          <div
            v-if="showUtilityMenu"
            class="absolute right-0 mt-3 w-[20rem] rounded-3xl border shadow-2xl backdrop-blur-xl p-4"
            :class="
              store.isNightMode
                ? 'bg-[#121212]/95 border-white/10 text-white'
                : 'bg-white/95 border-gray-200 text-gray-800'
            "
          >
            <div class="mb-4">
              <div
                class="text-xs uppercase tracking-[0.24em]"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                Utility Panel
              </div>
              <div class="mt-2 text-sm">
                当前身份档案：
                <span class="font-bold">{{ store.activeSlotMeta?.name || '未命名身份档案' }}</span>
              </div>
              <div
                v-if="store.persistenceError"
                class="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500"
              >
                本地保存异常：{{ store.persistenceError.action }}。请尽快导出当前身份档案。
              </div>
            </div>

            <div class="space-y-2">
              <button
                @click="handleExitToSlots"
                class="w-full px-4 py-3 rounded-2xl text-left font-semibold transition-colors"
                :class="
                  store.isNightMode
                    ? 'bg-amber-900/30 hover:bg-amber-800/40 text-amber-200'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                "
              >
                🗂️ 返回身份档案
              </button>
              <div
                class="w-full px-4 py-3 rounded-2xl text-left font-semibold border"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-white/5 text-gray-500'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                "
              >
                💾 身份档案保存在此设备
              </div>
            </div>
          </div>
        </div>

        <button
          @click="store.toggleNightMode"
          class="p-2 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 shadow-lg group"
        >
          <span class="text-xl inline-block group-hover:animate-spin-slow origin-center">{{
            store.isNightMode ? '🌛' : '☀️'
          }}</span>
        </button>
      </div>

      <div class="flex-1 flex flex-col relative z-10 pb-16 md:pb-0 overflow-hidden">
        <ShopView v-if="store.activeView === 'shop'" />
        <MapView v-else-if="store.activeView === 'map'" />
        <ForestView v-else-if="store.activeView === 'forest'" />
        <NotebookView v-else-if="store.activeView === 'notebook'" />

        <IdleDashboard v-else-if="store.activeView === 'dashboard' && store.activeActionId" />

        <div v-else class="flex-1 flex flex-col items-center justify-center">
          <div class="text-6xl mb-4 opacity-50">⬅️</div>
          <p class="text-xl">请选择一个行动</p>
        </div>
      </div>

      <div
        class="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] z-50 border-t backdrop-blur-xl flex justify-around items-center px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors duration-300"
        :class="
          store.isNightMode ? 'bg-[#1a1a1a]/90 border-gray-700' : 'bg-white/90 border-gray-200'
        "
      >
        <button @click="store.openShop()" :class="bottomNavClass('shop')">
          <span class="text-2xl mb-0.5">🏪</span>
          <span class="text-[10px] font-bold uppercase">Shop</span>
        </button>

        <button @click="store.openForest()" :class="bottomNavClass('forest')">
          <div
            class="bg-green-600 rounded-full p-3 -mt-8 shadow-lg border-4 border-opacity-20"
            :class="
              store.activeView === 'forest' ? 'border-green-300 scale-110' : 'border-transparent'
            "
          >
            <span class="text-2xl text-white">🧭</span>
          </div>
          <span class="text-[10px] font-bold uppercase mt-1">Forest</span>
        </button>

        <button @click="store.openNotebook()" :class="bottomNavClass('notebook')">
          <span class="text-2xl mb-0.5">📝</span>
          <span class="text-[10px] font-bold uppercase">Notes</span>
        </button>
      </div>

      <Transition name="fade">
        <div
          v-if="store.offlineEarnings"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div
            class="relative rounded-2xl shadow-2xl p-6 max-w-sm w-full border overflow-hidden animate-in zoom-in duration-300"
            :class="
              store.isNightMode
                ? 'bg-[#1a1a1a] text-gray-200 border-gray-700'
                : 'bg-white text-gray-800 border-gray-200'
            "
          >
            <div class="text-center mb-6">
              <div class="text-4xl mb-2 animate-bounce">🌱</div>
              <h2 class="text-xl font-bold mb-2">欢迎回来!</h2>
              <p class="text-sm opacity-70">
                你离开了
                <span class="font-bold text-blue-500">{{
                  formatDuration(store.offlineEarnings.secondsPassed)
                }}</span>
              </p>
            </div>

            <div
              class="rounded-xl p-4 mb-6 flex justify-between items-center border"
              :class="
                store.isNightMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              "
            >
              <div class="flex items-center gap-3">
                <img
                  :src="store.offlineEarnings.tree.icon"
                  class="w-10 h-10 object-contain pixel-art shadow-sm"
                />
                <div class="text-left">
                  <div class="font-bold text-sm">{{ store.offlineEarnings.tree.name }}</div>
                  <div class="text-xs text-green-500 font-bold">
                    <template v-if="store.offlineEarnings.mode === store.PLANTING_MODES.COUNTDOWN">
                      剩余
                      {{
                        formatDuration(
                          Math.max(
                            0,
                            store.offlineEarnings.targetDuration - store.offlineEarnings.newTimer,
                          ),
                        )
                      }}
                    </template>
                    <template v-else>
                      已计时 {{ formatDuration(store.offlineEarnings.newTimer) }}
                    </template>
                  </div>
                  <div class="text-xs text-emerald-400">
                    新完成 {{ store.offlineEarnings.completedCycles }} 个周期
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs opacity-60">当前状态</div>
                <div class="font-bold text-blue-500">
                  {{
                    store.offlineEarnings.newTimer >= store.taskLimit ? '已到上限' : '继续挂机中'
                  }}
                </div>
              </div>
            </div>

            <div>
              <button
                @click="store.claimOfflineEarnings()"
                class="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-xs shadow-lg hover:bg-green-500 hover:scale-105 transition-all"
              >
                ✅ 确认离线进度
              </button>
            </div>
          </div>
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
import AppDialogHost from './components/AppDialogHost.vue'
import Sidebar from './components/Sidebar.vue'
import SaveSlotSelectView from './components/SaveSlotSelectView.vue'
import IdleDashboard from './components/IdleDashboard.vue'
import ShopView from './components/ShopView.vue'
import MapView from './components/MapView.vue'
import ForestView from './components/ForestView.vue'
import NotebookView from './components/NotebookView.vue'
import { useAppStore } from '@/stores/appStore'
import { usePlantingStore } from '@/stores/plantingStore'
import { useActionStore } from '@/stores/actionStore'
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
  openForest: actionWorkflow.openForest,
  openNotebook: appStore.openNotebook,
  openShop: appStore.openShop,
  toggleNightMode: appStore.toggleNightMode,
})
const showMobileMenu = ref(false)
const showUtilityMenu = ref(false)
const SYSTEM_VIEWS = new Set(['shop', 'map', 'notebook'])

onMounted(() => {
  plantingStore.attachRuntime()
  store.initSaveSystem()
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  plantingStore.detachRuntime()
  document.removeEventListener('click', handleDocumentClick)
})

const isSystemView = computed(() => SYSTEM_VIEWS.has(store.activeView))

const mainShellClass = computed(() => {
  if (isSystemView.value) {
    return store.isNightMode ? 'bg-[#0d1210] text-gray-100' : 'bg-[#eef3ea] text-gray-900'
  }

  return store.isNightMode ? 'bg-[#0f172a] text-gray-200' : 'bg-[#e0f2fe] text-gray-900'
})

const backgroundStyle = computed(() => {
  if (isSystemView.value) {
    return store.isNightMode
      ? {
          backgroundImage:
            'linear-gradient(135deg, rgba(7, 12, 10, 0.96) 0%, rgba(14, 22, 18, 0.92) 52%, rgba(20, 29, 24, 0.94) 100%), radial-gradient(circle at top left, rgba(109, 151, 115, 0.14), transparent 24%), radial-gradient(circle at bottom right, rgba(216, 180, 108, 0.12), transparent 22%), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 120px)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {
          backgroundImage:
            'linear-gradient(135deg, rgba(244, 247, 241, 0.98) 0%, rgba(232, 238, 228, 0.96) 55%, rgba(224, 232, 221, 0.94) 100%), radial-gradient(circle at top left, rgba(128, 163, 132, 0.18), transparent 26%), radial-gradient(circle at bottom right, rgba(191, 158, 99, 0.16), transparent 22%), repeating-linear-gradient(90deg, rgba(48, 74, 58, 0.05) 0, rgba(48, 74, 58, 0.05) 1px, transparent 1px, transparent 120px)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
  }

  if (store.activeView === 'forest') {
    return store.isNightMode
      ? {
          backgroundImage:
            'linear-gradient(180deg, #1b1611 0%, #241d16 100%), radial-gradient(circle at top center, rgba(251, 191, 36, 0.06), transparent 24%), radial-gradient(circle at bottom left, rgba(120, 53, 15, 0.08), transparent 30%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {
          backgroundImage:
            'linear-gradient(180deg, #f1e4d2 0%, #e7d7c1 100%), radial-gradient(circle at top center, rgba(245, 158, 11, 0.08), transparent 24%), radial-gradient(circle at bottom left, rgba(180, 83, 9, 0.08), transparent 30%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
  }

  const img = store.isNightMode ? bgNight : bgDay
  return {
    backgroundImage: `url(${img})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
  }
})

const bottomNavClass = (view) => {
  const isActive = store.activeView === view
  const base =
    'flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 '

  if (view === 'forest') return base + (store.isNightMode ? 'text-gray-400' : 'text-gray-600')

  const activeColor = store.isNightMode ? 'text-green-400' : 'text-emerald-600'
  const inactiveColor = store.isNightMode ? 'text-gray-500' : 'text-gray-400'

  return base + (isActive ? activeColor : inactiveColor)
}

const handleDocumentClick = (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('.absolute.top-4.right-4')) return
  showUtilityMenu.value = false
}

const handleExitToSlots = () => {
  showUtilityMenu.value = false
  store.exitToSaveSelection()
}

// [新增] 格式化时间辅助函数 (用于弹窗)
const formatDuration = (seconds) => {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
</script>

<style>
/* 简单的抽屉动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* [新增] 弹窗淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
