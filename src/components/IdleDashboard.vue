<template>
  <div class="flex-1 p-6 flex flex-col h-full overflow-hidden bg-transparent relative">
    <div
      class="rounded-2xl p-6 mb-6 shadow-lg shrink-0 border backdrop-blur-md transition-all duration-300"
      :class="
        store.isNightMode
          ? 'bg-[#1a1a1a]/80 border-gray-700'
          : 'bg-white/70 border-white/60 shadow-xl ring-1 ring-black/5'
      "
    >
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-5">
          <div
            class="p-4 rounded-xl text-4xl shadow-inner border transition-colors duration-300"
            :class="
              store.isNightMode
                ? 'bg-[#333] border-[#444] text-gray-200'
                : 'bg-white border-gray-200 text-gray-800 shadow-sm'
            "
          >
            {{ store.activeAction?.icon || '📁' }}
          </div>

          <div>
            <div
              class="text-xs uppercase tracking-widest mb-1 font-bold transition-colors"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              Current Action
            </div>
            <h2
              class="text-3xl font-bold tracking-wide transition-colors duration-300"
              :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
            >
              {{ store.activeAction?.name || '未选择行动' }}
            </h2>

            <div class="flex items-center gap-3 mt-2">
              <span
                class="px-2 py-0.5 rounded border font-bold text-xs transition-colors"
                :class="
                  store.isNightMode
                    ? 'bg-blue-900/40 border-blue-800 text-blue-300'
                    : 'bg-blue-50 border-blue-200 text-blue-600'
                "
              >
                Lv. {{ store.activeAction?.level || 1 }}
              </span>
              <span
                class="px-2 py-0.5 rounded border font-bold text-xs flex items-center gap-1 transition-colors"
                :class="
                  store.isNightMode
                    ? 'bg-green-900/40 border-green-800 text-green-300'
                    : 'bg-green-50 border-green-200 text-emerald-600'
                "
              >
                <span>🌲</span>{{ store.activeAction?.totalTrees || 0 }}
              </span>
              <span
                class="px-2 py-0.5 rounded border font-bold text-xs flex items-center gap-1 transition-colors"
                :class="
                  store.isNightMode
                    ? 'bg-purple-900/40 border-purple-800 text-purple-300'
                    : 'bg-purple-50 border-purple-200 text-purple-600'
                "
              >
                <span>⏱️</span>{{ formatDuration(displayedActionTime) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="relative h-14 rounded-xl border overflow-hidden mt-6 group shadow-inner transition-colors duration-300"
        :class="
          store.isNightMode ? 'bg-[#0f0f0f] border-gray-700' : 'bg-gray-200/50 border-gray-300'
        "
      >
        <template v-if="store.activeActionId === store.runningActionId">
          <div
            class="absolute top-0 left-0 h-full transition-all duration-100 ease-linear shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            :class="[
              isHarvestReady
                ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.8)]'
                : store.isNightMode
                  ? 'bg-gradient-to-r from-emerald-900 to-emerald-600'
                  : 'bg-gradient-to-r from-emerald-300 to-emerald-500',
            ]"
            :style="{ width: store.progressPercentage + '%' }"
          ></div>

          <div class="absolute inset-0 flex items-center justify-between px-6 z-10">
            <div class="flex items-center gap-3">
              <img
                v-if="store.isRunning && store.activeTree && !isHarvestReady"
                :src="store.activeTree.icon"
                class="h-8 w-8 object-contain pixel-art animate-bounce filter drop-shadow-md"
              />
              <span v-else-if="store.activeTree" class="text-2xl">🌱</span>

              <span
                class="font-bold text-lg tracking-wide drop-shadow-md transition-colors"
                :class="
                  isHarvestReady
                    ? 'text-red-900 animate-pulse'
                    : store.isNightMode
                      ? 'text-gray-200'
                      : 'text-gray-800'
                "
              >
                <template v-if="isHarvestReady"> [ TASK COMPLETE // HARVEST REQUIRED ] </template>
                <template v-else>
                  {{ store.activeTree ? `种植: ${store.activeTree.name}` : 'Ready...' }}
                </template>
              </span>

              <span
                v-if="!store.isRunning && store.timer > 0 && !isHarvestReady"
                class="text-xs font-bold px-2 py-0.5 rounded border animate-pulse"
                :class="
                  store.isNightMode
                    ? 'text-yellow-500 border-yellow-700 bg-yellow-900/30'
                    : 'text-yellow-700 border-yellow-400 bg-yellow-100'
                "
              >
                PAUSED
              </span>
            </div>

            <div v-if="store.activeTree" class="text-right font-mono">
              <div
                class="text-xl font-bold transition-colors"
                :class="
                  isHarvestReady
                    ? 'text-red-900'
                    : store.isNightMode
                      ? 'text-white'
                      : 'text-gray-700'
                "
              >
                {{ formatTime(currentCycleTime) }} / {{ formatTime(store.activeTree.time) }}
              </div>
              <div class="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {{ taskTimeCaption }}
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div
            class="absolute inset-0 flex items-center justify-center text-sm font-bold uppercase tracking-widest z-10 transition-colors"
            :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'"
          >
            Waiting to grow...
          </div>
        </template>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <h3
        class="text-sm font-bold uppercase tracking-widest mb-4 px-1 transition-colors"
        :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'"
      >
        Your Inventory
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-24">
        <div
          v-for="tree in store.inventoryTrees"
          :key="tree.id"
          @click="handleButtonClick(tree)"
          class="relative border-2 rounded-2xl p-5 transition-all cursor-pointer group select-none hover:-translate-y-1 backdrop-blur-sm shadow-md"
          :class="getCardClass(tree.id)"
        >
          <div class="flex flex-col items-center text-center">
            <div
              class="mb-4 transform group-hover:scale-110 transition-transform filter drop-shadow-md h-16 flex items-center justify-center"
            >
              <img
                :src="tree.icon"
                class="h-full w-auto object-contain pixel-art"
                alt="Tree Icon"
              />
            </div>

            <h3
              class="text-lg font-bold mb-1 transition-colors"
              :class="store.isNightMode ? 'text-gray-100' : 'text-gray-800'"
            >
              {{ tree.name }}
            </h3>

            <div class="w-full space-y-2 mb-4 text-xs font-medium">
              <div
                class="flex items-center justify-between rounded px-3 py-1.5 transition-colors"
                :class="
                  store.isNightMode ? 'bg-black/20 text-gray-400' : 'bg-gray-100 text-gray-500'
                "
              >
                <span>XP Gain</span>

                <span
                  class="text-sm font-bold"
                  :class="store.isNightMode ? 'text-blue-400' : 'text-blue-600'"
                >
                  +{{ store.getTreeYield(tree, store.activeAction).xp }}
                </span>
              </div>

              <div
                class="flex items-center justify-between rounded px-3 py-1.5 transition-colors"
                :class="
                  store.isNightMode ? 'bg-black/20 text-gray-400' : 'bg-gray-100 text-gray-500'
                "
              >
                <span>Cycle Time</span>

                <span
                  class="text-sm font-bold"
                  :class="store.isNightMode ? 'text-emerald-400' : 'text-emerald-600'"
                >
                  {{ formatTime(tree.time) }}
                </span>
              </div>
            </div>

            <div class="w-full space-y-2">
              <button
                class="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest shadow-sm transition-all"
                :class="getButtonClass(tree)"
                @click.stop="handleButtonClick(tree)"
              >
                <span v-if="getButtonText(tree) !== '>_ CLAIM'">
                  {{ getButtonIcon(tree) }}
                </span>

                {{ getButtonText(tree) }}
              </button>

              <button
                class="w-full rounded-lg border px-3 py-2 text-xs font-bold transition-colors"
                :class="getEndButtonClass(tree)"
                :disabled="!canEndPlanting(tree)"
                @click.stop="handleEndPlanting"
              >
                ■ 结束种植
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showModeModal"
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-md"
      >
        <div
          class="my-auto w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
          :class="
            store.isNightMode
              ? 'border-gray-700 bg-[#171717] text-gray-100'
              : 'border-emerald-200 bg-white text-gray-800'
          "
        >
          <div class="mb-6 flex items-start justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.25em] text-emerald-500">
                Planting Timer
              </p>
              <h2 class="mt-2 text-2xl font-bold">选择计时模式</h2>
            </div>
            <button class="text-gray-400 hover:text-gray-700" @click="closeModeModal">✕</button>
          </div>

          <div class="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm">
            <div>
              <p class="text-xs text-gray-500">当前行动</p>
              <p class="mt-1 font-bold">{{ store.activeAction?.name }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">树种 / 单周期</p>
              <p class="mt-1 font-bold">
                {{ selectedTree?.name }} · {{ formatTime(selectedTree?.time || 0) }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button
              class="rounded-xl border p-4 text-left transition-colors"
              :class="
                selectedMode === store.PLANTING_MODES.COUNTUP
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                  : 'border-gray-300 text-gray-500'
              "
              @click="selectTimerMode(store.PLANTING_MODES.COUNTUP)"
            >
              <span class="block font-bold">正计时</span>
              <span class="mt-1 block text-xs">显示已用时间；不设置时默认 3 小时</span>
            </button>
            <button
              class="rounded-xl border p-4 text-left transition-colors"
              :class="
                selectedMode === store.PLANTING_MODES.COUNTDOWN
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                  : 'border-gray-300 text-gray-500'
              "
              @click="selectTimerMode(store.PLANTING_MODES.COUNTDOWN)"
            >
              <span class="block font-bold">倒计时</span>
              <span class="mt-1 block text-xs">显示剩余时间；归零后自动结束</span>
            </button>
          </div>

          <label class="mt-5 block text-sm font-bold" for="planting-duration">
            目标时长（分钟）
          </label>
          <input
            id="planting-duration"
            v-model="durationMinutes"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 outline-none focus:border-emerald-500"
            type="number"
            :min="minimumDurationMinutes"
            max="1440"
            :placeholder="
              selectedMode === store.PLANTING_MODES.COUNTUP
                ? '可选，默认 180 分钟'
                : `至少 ${minimumDurationMinutes} 分钟`
            "
            @input="modeError = ''"
          />
          <p class="mt-2 text-xs text-gray-500">
            可设置 {{ minimumDurationMinutes }} 至 1440 分钟，不需要是单周期时长的整数倍。
          </p>
          <p v-if="modeError" class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {{ modeError }}
          </p>

          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-xl px-4 py-2 text-sm font-bold text-gray-500"
              @click="closeModeModal"
            >
              取消
            </button>
            <button
              class="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-400"
              @click="confirmStartPlanting"
            >
              开始种植
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showHarvestModal"
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-md"
      >
        <div
          class="my-auto flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border-2 border-green-500/50 bg-[#0a0a0a] font-mono text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.15)]"
        >
          <div
            class="bg-green-900/30 px-4 py-2 text-xs text-green-400 border-b border-green-800/50 flex justify-between items-center"
          >
            <span class="animate-pulse">TERMINAL // RANGER_NOTES.EXE</span>
            <button @click="closeHarvestModal" class="hover:text-white transition-colors">
              [_X]
            </button>
          </div>

          <div class="custom-scrollbar-terminal space-y-4 overflow-y-auto p-6 text-sm md:text-base">
            <div class="space-y-1">
              <p>> SYSTEM: HARVEST PROTOCOL INITIATED...</p>
              <p>
                > TARGET_ACTION:
                <span class="text-white font-bold">{{ store.runningAction?.name }}</span>
              </p>
              <p>
                > TIMER_MODE: <span class="text-white font-bold">{{ store.timerModeLabel }}</span>
              </p>
              <p>
                > TARGET_DURATION:
                <span class="text-white font-bold">{{ formatTime(store.taskLimit) }}</span>
              </p>
              <p>
                > DURATION_LOGGED:
                <span class="text-white font-bold">{{ formatTime(store.timer) }}</span>
              </p>
              <p>
                > COMPLETED_CYCLES: <span class="text-white font-bold">{{ harvestCycles }}</span>
              </p>
              <p>
                > TREES_SETTLED: <span class="text-white font-bold">+{{ store.taskTrees }}</span>
              </p>
              <p>
                > XP_SETTLED: <span class="text-white font-bold">+{{ store.taskXP }}</span>
              </p>
              <p>
                > LEVEL_CHANGE:
                <span class="text-white font-bold"
                  >Lv.{{ store.taskStartLevel }} → Lv.{{ store.runningAction?.level }}</span
                >
              </p>
              <p>
                > END_REASON: <span class="text-white font-bold">{{ harvestEndReasonLabel }}</span>
              </p>
              <p v-if="isHarvestReady" class="text-red-500">> TARGET DURATION REACHED.</p>
            </div>

            <div class="mt-6">
              <p class="mb-2">> ENTER_PLANTING_LOG (Optional) :</p>
              <textarea
                v-model="logContent"
                @keydown.ctrl.enter="confirmHarvest"
                class="w-full h-36 bg-[#050505] border border-green-800 rounded p-3 text-green-400 focus:outline-none focus:border-green-500 focus:shadow-[0_0_15px_rgba(34,197,94,0.3)] resize-none custom-scrollbar-terminal transition-all"
                placeholder="> Await user input... (Press Ctrl+Enter to execute upload)"
                autofocus
              ></textarea>
              <p class="text-xs mt-2 text-green-700">有效日志固定奖励 10 金币</p>
            </div>

            <div class="rounded-lg border border-green-800/60 bg-green-950/20 p-4 space-y-2">
              <p>> ACTION_LOCKED :</p>
              <p class="text-sm text-green-300">
                本次成果已在周期完成时结算到
                <span class="text-white font-bold">{{ store.runningAction?.name }}</span
                >，关闭总结不会再次发奖。
              </p>
            </div>
          </div>

          <div class="p-4 border-t border-green-800/50 flex justify-end gap-4 bg-[#050505]">
            <button
              @click="closeHarvestModal"
              class="px-5 py-2 text-green-700 hover:text-green-500 transition-colors"
            >
              CLOSE_WITHOUT_LOG
            </button>
            <button
              @click="confirmHarvest"
              class="px-6 py-2 bg-green-900/40 border border-green-600 text-green-400 hover:bg-green-800 hover:text-white transition-all rounded shadow-[0_0_15px_rgba(34,197,94,0.2)]"
            >
              EXECUTE_UPLOAD
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { confirmDialog } from '@/composables/dialogService'
import { useAppStore } from '@/stores/appStore'
import { usePlantingStore } from '@/stores/plantingStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useActionStore } from '@/stores/actionStore'

const appStore = useAppStore()
const playerStore = usePlayerStore()
const actionStore = useActionStore()
const plantingStore = usePlantingStore()
const store = reactive({
  ...storeToRefs(appStore),
  ...storeToRefs(playerStore),
  ...storeToRefs(actionStore),
  ...storeToRefs(plantingStore),
  PLANTING_MODES: plantingStore.PLANTING_MODES,
  getTreeYield: plantingStore.getTreeYield,
  startAction: plantingStore.startAction,
  stopTimer: plantingStore.stopTimer,
  submitHarvest: plantingStore.submitHarvest,
  toggleAction: plantingStore.toggleAction,
})

// --- Modal 状态管理 ---
const showHarvestModal = ref(false)
const showModeModal = ref(false)
const logContent = ref('')
const pendingTreeId = ref(null)
const selectedTree = ref(null)
const selectedMode = ref(store.PLANTING_MODES.COUNTUP)
const durationMinutes = ref('')
const modeError = ref('')
const harvestEndReason = ref('manual')

// 计算是否满足收获条件（时间达标）
const isHarvestReady = computed(() => {
  return Boolean(store.activeTree && store.taskTimeState.reachedLimit)
})

const minimumDurationMinutes = computed(() => Math.ceil((selectedTree.value?.time || 0) / 60))

const taskTimeCaption = computed(() => {
  if (store.timerMode === store.PLANTING_MODES.COUNTDOWN) {
    return `倒计时剩余 ${formatTime(store.taskTimeState.remaining)}`
  }
  return `正计时 ${formatTime(store.taskTimeState.elapsed)} / ${formatTime(store.taskLimit)}`
})

const harvestEndReasonLabel = computed(() => {
  if (harvestEndReason.value === 'limit') return '达到目标时长'
  if (harvestEndReason.value === 'switch') return '切换种植任务'
  return '主动结束'
})

const currentCycleTime = computed(() => {
  if (!store.activeTree) return 0
  return Math.max(0, store.timer - store.settledCycles * store.activeTree.time)
})

const displayedActionTime = computed(() => {
  return store.activeAction?.totalTimeSpent || 0
})

// 计算本次总共完成了多少轮（正向计时倍数）
const harvestCycles = computed(() => {
  return store.settledCycles
})

// === 格式化函数 ===
const formatTime = (s) => {
  const seconds = Math.max(0, Math.floor(s || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatDuration = (seconds) => {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// === 状态判断 ===
const isTreeActive = (treeId) => {
  return store.activeTreeId === treeId && store.activeActionId === store.runningActionId
}

const canEndPlanting = (tree) => {
  return isTreeActive(tree.id) && !isHarvestReady.value
}

const getEndButtonClass = (tree) => {
  if (canEndPlanting(tree)) {
    return 'border-red-400/60 text-red-500 hover:bg-red-500 hover:text-white'
  }

  return store.isNightMode
    ? 'cursor-not-allowed border-gray-700 bg-gray-800/40 text-gray-600 opacity-60'
    : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-60'
}

// === 动态样式逻辑 ===
const getCardClass = (treeId) => {
  if (isTreeActive(treeId)) {
    if (isHarvestReady.value) {
      return store.isNightMode
        ? 'border-red-600 bg-[#3a1a1a] shadow-[0_0_20px_rgba(220,38,38,0.3)]'
        : 'border-red-500 bg-red-50 shadow-[0_0_20px_rgba(220,38,38,0.4)] ring-2 ring-red-400/30'
    }
    return store.isNightMode
      ? 'border-emerald-600 bg-[#2a302a]/90'
      : 'border-emerald-500 bg-emerald-50/90 shadow-emerald-100 ring-2 ring-emerald-500/20'
  }
  return store.isNightMode
    ? 'bg-[#1a1a1a]/80 border-gray-700 hover:border-gray-500 hover:bg-[#252525]'
    : 'bg-white/60 border-white/60 hover:border-emerald-300 hover:bg-white/90'
}

const getButtonClass = (tree) => {
  if (isTreeActive(tree.id)) {
    if (isHarvestReady.value) {
      return 'bg-[#0a0a0a] text-red-400 border border-red-500 font-mono font-bold hover:bg-red-900 hover:text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse'
    }
    return store.isRunning
      ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg'
      : 'bg-emerald-600 text-white hover:bg-emerald-500 animate-pulse hover:shadow-lg'
  }
  return store.isNightMode
    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200'
}

const getButtonText = (tree) => {
  if (isTreeActive(tree.id)) {
    if (isHarvestReady.value) return '>_ CLAIM'
    return store.isRunning ? 'Pause' : 'Resume'
  }
  return 'Start'
}

const getButtonIcon = (tree) => {
  if (isTreeActive(tree.id)) {
    if (isHarvestReady.value) return ''
    return store.isRunning ? '⏸' : '▶'
  }
  return '🌱'
}

// === 交互行为 ===
const openHarvestSummary = (reason = 'manual') => {
  store.stopTimer()
  logContent.value = ''
  harvestEndReason.value = reason
  showHarvestModal.value = true
}

const openModeModal = (tree) => {
  selectedTree.value = tree
  selectedMode.value = store.PLANTING_MODES.COUNTUP
  durationMinutes.value = ''
  modeError.value = ''
  showModeModal.value = true
}

const closeModeModal = () => {
  showModeModal.value = false
  selectedTree.value = null
  modeError.value = ''
}

const selectTimerMode = (mode) => {
  selectedMode.value = mode
  durationMinutes.value = ''
  modeError.value = ''
}

const confirmStartPlanting = () => {
  if (!selectedTree.value) return
  const targetDuration = durationMinutes.value === '' ? '' : Number(durationMinutes.value) * 60
  const result = store.startAction(selectedTree.value.id, {
    mode: selectedMode.value,
    targetDuration,
  })
  if (!result.ok) {
    modeError.value = result.error
    return
  }
  closeModeModal()
}

const handleEndPlanting = async () => {
  const confirmed = await confirmDialog(
    '是否结束当前种植任务？已完成周期的种植成果会保留，当前未完成周期不会获得树木和经验。',
    { title: '结束种植', confirmText: '结束任务' },
  )
  if (confirmed) openHarvestSummary('manual')
}

const handleButtonClick = async (tree) => {
  if (isTreeActive(tree.id)) {
    if (isHarvestReady.value) {
      openHarvestSummary('limit')
    } else {
      store.toggleAction()
    }
  } else {
    if (store.runningActionId) {
      const confirmed = await confirmDialog(
        '是否切换种植任务？已完成周期的成果会保留，当前未完成周期将被清空。',
        { title: '切换种植任务', confirmText: '结束并切换' },
      )
      if (!confirmed) return
      pendingTreeId.value = tree.id
      openHarvestSummary('switch')
      return
    }
    openModeModal(tree)
  }
}

const closeHarvestModal = () => {
  finishHarvest('')
}

const finishHarvest = (content) => {
  const submitted = store.submitHarvest(content)
  if (!submitted) return

  showHarvestModal.value = false
  logContent.value = ''
  const nextTreeId = pendingTreeId.value
  pendingTreeId.value = null
  if (nextTreeId) {
    const nextTree = store.inventoryTrees.find((tree) => tree.id === nextTreeId)
    if (nextTree) openModeModal(nextTree)
  }
}

const confirmHarvest = () => finishHarvest(logContent.value)

watch(isHarvestReady, (reachedLimit) => {
  if (reachedLimit && !showHarvestModal.value) openHarvestSummary('limit')
})
</script>

<style scoped>
.pixel-art {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

/* 终端风格滚动条 */
.custom-scrollbar-terminal::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar-terminal::-webkit-scrollbar-track {
  background: #000;
}
.custom-scrollbar-terminal::-webkit-scrollbar-thumb {
  background-color: #166534;
  border-radius: 4px;
}
.custom-scrollbar-terminal::-webkit-scrollbar-thumb:hover {
  background-color: #22c55e;
}
</style>
