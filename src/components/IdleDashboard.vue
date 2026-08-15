<template>
  <div class="ranger-dashboard">
    <div class="ranger-dashboard__scroll subtle-scrollbar">
      <section class="paper-panel ranger-dashboard__summary">
        <div class="ranger-dashboard__identity">
          <div class="ranger-dashboard__action-mark" aria-hidden="true">
            {{ (store.activeAction?.name || '行').slice(0, 1) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="paper-label">当前实践路径</div>
            <h2 class="display-title mt-1 truncate text-2xl">
              {{ store.activeAction?.name || '未选择行动' }}
            </h2>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="field-chip"
                >等级 <strong>{{ store.activeAction?.level || 1 }}</strong></span
              >
              <span class="field-chip"
                >累计树木 <strong>{{ store.activeAction?.totalTrees || 0 }}</strong></span
              >
              <span class="field-chip"
                >累计投入 <strong>{{ formatDuration(displayedActionTime) }}</strong></span
              >
            </div>
          </div>
        </div>

        <div
          class="ranger-session"
          :class="{
            'ranger-session--active': store.activeActionId === store.runningActionId,
            'ranger-session--ready': isHarvestReady,
          }"
        >
          <template v-if="store.activeActionId === store.runningActionId && store.activeTree">
            <div class="ranger-session__tree">
              <img :src="store.activeTree.icon" class="pixel-art h-14 w-14 object-contain" alt="" />
              <div class="min-w-0">
                <div class="paper-label">
                  {{ isHarvestReady ? '本次巡林已到目标' : '正在陪伴种植' }}
                </div>
                <div class="display-title mt-1 text-lg">{{ store.activeTree.name }}</div>
                <div class="mt-1 text-xs" style="color: var(--ink-soft)">
                  {{ store.isRunning ? '计时进行中' : '已暂停，当前进度会保留' }}
                </div>
              </div>
            </div>

            <div class="ranger-session__clock">
              <div class="paper-label">{{ store.timerModeLabel }}</div>
              <div class="ranger-session__time">
                {{ formatTime(currentCycleTime) }}
                <span>/ {{ formatTime(store.activeTree.time) }}</span>
              </div>
              <div class="mt-1 text-xs" style="color: var(--ink-soft)">{{ taskTimeCaption }}</div>
            </div>

            <div class="ranger-session__controls">
              <button
                type="button"
                :class="isHarvestReady ? 'danger-button' : 'primary-button'"
                @click="handleButtonClick(store.activeTree)"
              >
                {{ getButtonText(store.activeTree) }}
              </button>
              <button
                type="button"
                class="quiet-button"
                :disabled="!canEndPlanting(store.activeTree)"
                @click="handleEndPlanting"
              >
                结束本次种植
              </button>
            </div>

            <div class="ranger-session__progress" aria-label="当前种植周期进度">
              <div :style="{ width: store.progressPercentage + '%' }"></div>
            </div>
          </template>

          <template v-else>
            <div>
              <div class="paper-label">尚未出发</div>
              <div class="display-title mt-1 text-lg">从下方选择一类树木</div>
              <p class="mt-1 text-xs leading-5" style="color: var(--ink-soft)">
                设定计时方式后，应用会安静记录这次现实行动。
              </p>
            </div>
            <div class="ranger-session__empty-note">每个完整周期都会留下树木与经验</div>
          </template>
        </div>
      </section>

      <section class="ranger-dashboard__catalog">
        <header class="ranger-dashboard__catalog-header">
          <div>
            <div class="paper-label">植物图鉴</div>
            <h3 class="display-title mt-1 text-xl">选择本次陪伴你的树种</h3>
          </div>
          <p class="max-w-md text-right text-xs leading-5" style="color: var(--ink-soft)">
            树木不是奖励爆点，而是这段投入留下的安静证据。
          </p>
        </header>

        <div class="ranger-tree-grid">
          <article
            v-for="tree in store.inventoryTrees"
            :key="tree.id"
            class="ranger-tree-card"
            :class="getCardClass(tree.id)"
          >
            <div class="ranger-tree-card__head">
              <div class="ranger-tree-card__specimen">
                <img :src="tree.icon" class="pixel-art h-16 w-16 object-contain" :alt="tree.name" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="paper-label">{{ isTreeActive(tree.id) ? '当前树种' : '可选树种' }}</div>
                <h4 class="display-title mt-1 text-lg">{{ tree.name }}</h4>
                <p class="mt-1 text-xs" style="color: var(--ink-soft)">
                  单周期 {{ formatTime(tree.time) }}
                </p>
              </div>
            </div>

            <dl class="ranger-tree-card__facts">
              <div>
                <dt>每周期经验</dt>
                <dd>+{{ store.getTreeYield(tree, store.activeAction).xp }}</dd>
              </div>
              <div>
                <dt>生长节奏</dt>
                <dd>{{ formatTime(tree.time) }}</dd>
              </div>
            </dl>

            <div class="ranger-tree-card__actions">
              <button type="button" :class="getButtonClass(tree)" @click="handleButtonClick(tree)">
                {{ getButtonText(tree) }}
              </button>
              <button
                type="button"
                :class="getEndButtonClass(tree)"
                :disabled="!canEndPlanting(tree)"
                @click="handleEndPlanting"
              >
                结束
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <div
        v-if="showModeModal"
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 px-6 py-8 backdrop-blur-sm"
      >
        <section
          class="paper-panel my-auto w-full max-w-lg p-6"
          :data-theme="store.isNightMode ? 'night' : 'day'"
        >
          <div class="flex items-start justify-between gap-5">
            <div>
              <div class="paper-label">开始一次巡林会话</div>
              <h2 class="display-title mt-2 text-2xl">选择计时方式</h2>
              <p class="mt-2 text-sm" style="color: var(--ink-soft)">
                {{ store.activeAction?.name }} · {{ selectedTree?.name }}
              </p>
            </div>
            <button type="button" class="quiet-button" @click="closeModeModal">关闭</button>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="ranger-mode-option"
              :class="{
                'ranger-mode-option--active': selectedMode === store.PLANTING_MODES.COUNTUP,
              }"
              @click="selectTimerMode(store.PLANTING_MODES.COUNTUP)"
            >
              <strong>正计时</strong>
              <span>从零开始记录实际投入，适合开放式行动。</span>
            </button>
            <button
              type="button"
              class="ranger-mode-option"
              :class="{
                'ranger-mode-option--active': selectedMode === store.PLANTING_MODES.COUNTDOWN,
              }"
              @click="selectTimerMode(store.PLANTING_MODES.COUNTDOWN)"
            >
              <strong>倒计时</strong>
              <span>设定一个时段，归零后自动收束本次行动。</span>
            </button>
          </div>

          <label class="mt-5 block text-sm font-bold" for="planting-duration"
            >目标时长（分钟）</label
          >
          <input
            id="planting-duration"
            v-model="durationMinutes"
            class="ranger-input mt-2"
            type="number"
            :min="minimumDurationMinutes"
            max="1440"
            :placeholder="
              selectedMode === store.PLANTING_MODES.COUNTUP
                ? '可选，默认 180 分钟'
                : '至少 ' + minimumDurationMinutes + ' 分钟'
            "
            @input="modeError = ''"
          />
          <p class="mt-2 text-xs" style="color: var(--ink-soft)">
            可设置 {{ minimumDurationMinutes }} 至 1440 分钟，不需要是单周期的整数倍。
          </p>
          <p
            v-if="modeError"
            class="mt-3 rounded-lg border px-3 py-2 text-sm"
            style="border-color: var(--danger); color: var(--danger)"
          >
            {{ modeError }}
          </p>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="quiet-button" @click="closeModeModal">取消</button>
            <button type="button" class="primary-button" @click="confirmStartPlanting">
              开始种植
            </button>
          </div>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showHarvestModal"
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 px-6 py-8 backdrop-blur-sm"
      >
        <section
          class="paper-panel my-auto flex max-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col overflow-hidden"
          :data-theme="store.isNightMode ? 'night' : 'day'"
        >
          <header class="ranger-harvest__header">
            <div>
              <div class="paper-label">本次巡林记录</div>
              <h2 class="display-title mt-2 text-2xl">种植小结</h2>
            </div>
            <button type="button" class="quiet-button" @click="closeHarvestModal">关闭</button>
          </header>

          <div class="subtle-scrollbar overflow-y-auto px-6 py-5">
            <div class="ranger-harvest__grid">
              <div>
                <span>行动</span><strong>{{ store.runningAction?.name }}</strong>
              </div>
              <div>
                <span>计时方式</span><strong>{{ store.timerModeLabel }}</strong>
              </div>
              <div>
                <span>有效时长</span><strong>{{ formatTime(store.timer) }}</strong>
              </div>
              <div>
                <span>完成周期</span><strong>{{ harvestCycles }}</strong>
              </div>
              <div>
                <span>新增树木</span><strong>+{{ store.taskTrees }}</strong>
              </div>
              <div>
                <span>新增经验</span><strong>+{{ store.taskXP }}</strong>
              </div>
            </div>

            <label class="mt-6 block text-sm font-bold" for="planting-log"
              >留下一句巡林观察（可选）</label
            >
            <textarea
              id="planting-log"
              v-model="logContent"
              class="ranger-input mt-2 h-32 resize-none"
              placeholder="这段时间里发生了什么？"
              @keydown.ctrl.enter="confirmHarvest"
            ></textarea>
            <p class="mt-2 text-xs" style="color: var(--ink-soft)">
              记录会归入行动足迹；有效记录固定获得 10 金币。
            </p>
          </div>

          <footer class="ranger-harvest__footer">
            <button type="button" class="quiet-button" @click="closeHarvestModal">
              不写记录，直接结束
            </button>
            <button type="button" class="primary-button" @click="confirmHarvest">
              保存记录并结束
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { confirmDialog } from '@/composables/dialogService'
import { useActionStore } from '@/stores/actionStore'
import { useAppStore } from '@/stores/appStore'
import { usePlantingStore } from '@/stores/plantingStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useSaveStore } from '@/stores/saveStore'

const appStore = useAppStore()
const playerStore = usePlayerStore()
const actionStore = useActionStore()
const plantingStore = usePlantingStore()
const saveStore = useSaveStore()
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
  flushPersistence: saveStore.flushPersistence,
})

const showHarvestModal = ref(false)
const showModeModal = ref(false)
const logContent = ref('')
const pendingTreeId = ref(null)
const selectedTree = ref(null)
const selectedMode = ref(store.PLANTING_MODES.COUNTUP)
const durationMinutes = ref('')
const modeError = ref('')
const harvestEndReason = ref('manual')

const isHarvestReady = computed(() => Boolean(store.activeTree && store.taskTimeState.reachedLimit))
const minimumDurationMinutes = computed(() => Math.ceil((selectedTree.value?.time || 0) / 60))
const taskTimeCaption = computed(() => {
  if (store.timerMode === store.PLANTING_MODES.COUNTDOWN) {
    return `倒计时剩余 ${formatTime(store.taskTimeState.remaining)}`
  }
  return `本次已记录 ${formatTime(store.taskTimeState.elapsed)} / ${formatTime(store.taskLimit)}`
})
const currentCycleTime = computed(() => {
  if (!store.activeTree) return 0
  return Math.max(0, store.timer - store.settledCycles * store.activeTree.time)
})
const displayedActionTime = computed(() => store.activeAction?.totalTimeSpent || 0)
const harvestCycles = computed(() => store.settledCycles)

const formatTime = (value) => {
  const seconds = Math.max(0, Math.floor(value || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatDuration = (seconds) => {
  if (!seconds) return '0 分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`
}

const isTreeActive = (treeId) =>
  store.activeTreeId === treeId && store.activeActionId === store.runningActionId
const canEndPlanting = (tree) => isTreeActive(tree.id) && !isHarvestReady.value

const getEndButtonClass = (tree) =>
  canEndPlanting(tree) ? 'danger-button' : 'quiet-button opacity-45'
const getCardClass = (treeId) => {
  if (!isTreeActive(treeId)) return ''
  return isHarvestReady.value ? 'ranger-tree-card--ready' : 'ranger-tree-card--active'
}
const getButtonClass = (tree) => {
  if (!isTreeActive(tree.id)) return 'primary-button'
  return isHarvestReady.value ? 'danger-button' : 'quiet-button'
}
const getButtonText = (tree) => {
  if (isTreeActive(tree.id)) {
    if (isHarvestReady.value) return '完成并记录'
    return store.isRunning ? '暂停' : '继续'
  }
  return '开始种植'
}

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
    '是否结束当前种植？已完成周期的成果会保留，未完成周期不会获得树木和经验。',
    { title: '结束本次种植', confirmText: '结束并查看小结' },
  )
  if (confirmed) openHarvestSummary('manual')
}
const handleButtonClick = async (tree) => {
  if (!tree) return
  if (isTreeActive(tree.id)) {
    if (isHarvestReady.value) openHarvestSummary('limit')
    else store.toggleAction()
    return
  }
  if (store.runningActionId) {
    const confirmed = await confirmDialog(
      '是否切换种植任务？已完成周期会保留，当前未完成周期将被清空。',
      { title: '切换种植任务', confirmText: '结束并切换' },
    )
    if (!confirmed) return
    pendingTreeId.value = tree.id
    openHarvestSummary('switch')
    return
  }
  openModeModal(tree)
}
const closeHarvestModal = () => void finishHarvest('')
const finishHarvest = async (content) => {
  const submitted = store.submitHarvest(content, { endReason: harvestEndReason.value })
  if (!submitted) return
  const persisted = await store.flushPersistence({ reloadOnFailure: true })
  if (!persisted) return
  showHarvestModal.value = false
  logContent.value = ''
  const nextTreeId = pendingTreeId.value
  pendingTreeId.value = null
  if (nextTreeId) {
    const nextTree = store.inventoryTrees.find((tree) => tree.id === nextTreeId)
    if (nextTree) openModeModal(nextTree)
  }
}
const confirmHarvest = () => void finishHarvest(logContent.value)

watch(isHarvestReady, (reachedLimit) => {
  if (reachedLimit && !showHarvestModal.value) openHarvestSummary('limit')
})
</script>

<style scoped>
.ranger-dashboard {
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.ranger-dashboard__scroll {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 18px 20px 30px;
}

.ranger-dashboard__summary,
.ranger-dashboard__catalog {
  width: min(100%, 1280px);
  margin-inline: auto;
}

.ranger-dashboard__summary {
  padding: 20px;
}

.ranger-dashboard__identity {
  display: flex;
  align-items: center;
  gap: 15px;
}

.ranger-dashboard__action-mark {
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--paper-strong);
  background: var(--forest-deep);
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
}

.ranger-session {
  position: relative;
  display: grid;
  min-height: 112px;
  grid-template-columns: minmax(230px, 1fr) auto auto;
  align-items: center;
  gap: 22px;
  margin-top: 18px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 18px 20px;
  background: color-mix(in srgb, var(--sage) 10%, var(--paper-strong));
}

.ranger-session:not(.ranger-session--active) {
  grid-template-columns: minmax(260px, 1fr) auto;
}

.ranger-session--active {
  border-color: var(--line-strong);
}

.ranger-session--ready {
  border-color: color-mix(in srgb, var(--coral) 72%, transparent);
  background: color-mix(in srgb, var(--coral) 9%, var(--paper-strong));
}

.ranger-session__tree {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 13px;
}

.ranger-session__clock {
  min-width: 185px;
  text-align: right;
}

.ranger-session__time {
  margin-top: 3px;
  color: var(--ink);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.ranger-session__time span {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 600;
}

.ranger-session__controls {
  display: flex;
  min-width: 150px;
  flex-direction: column;
  gap: 7px;
}

.ranger-session__progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 5px;
  background: color-mix(in srgb, var(--ink-soft) 12%, transparent);
}

.ranger-session__progress > div {
  height: 100%;
  background: linear-gradient(90deg, var(--sage), var(--forest));
  transition: width 200ms linear;
}

.ranger-session__empty-note {
  max-width: 250px;
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.7;
  text-align: right;
}

.ranger-dashboard__catalog {
  padding-top: 22px;
}

.ranger-dashboard__catalog-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 11px 14px;
  background: color-mix(in srgb, var(--paper-strong) 88%, transparent);
  box-shadow: 0 6px 18px rgba(55, 58, 44, 0.06);
}

.ranger-tree-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(230px, 1fr));
  gap: 12px;
}

.ranger-tree-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px;
  background: color-mix(in srgb, var(--paper-strong) 94%, transparent);
  box-shadow: 0 8px 20px rgba(55, 58, 44, 0.08);
}

.ranger-tree-card--active {
  border-color: var(--forest);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--forest) 26%, transparent);
}

.ranger-tree-card--ready {
  border-color: var(--coral);
}

.ranger-tree-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ranger-tree-card__specimen {
  display: grid;
  width: 78px;
  height: 78px;
  flex: 0 0 78px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50% 50% 46% 54%;
  background: color-mix(in srgb, var(--sage) 10%, var(--paper));
}

.ranger-tree-card__facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.ranger-tree-card__facts > div {
  border-top: 1px solid var(--line);
  padding-top: 9px;
}

.ranger-tree-card__facts dt {
  color: var(--ink-soft);
  font-size: 10px;
}

.ranger-tree-card__facts dd {
  margin-top: 2px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 800;
}

.ranger-tree-card__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  margin-top: 12px;
}

.ranger-mode-option {
  display: flex;
  min-height: 104px;
  flex-direction: column;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: 11px;
  padding: 15px;
  color: var(--ink);
  background: color-mix(in srgb, var(--paper-strong) 76%, transparent);
  text-align: left;
}

.ranger-mode-option span {
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.6;
}

.ranger-mode-option--active {
  border-color: var(--forest);
  background: color-mix(in srgb, var(--sage) 15%, var(--paper-strong));
}

.ranger-input {
  width: 100%;
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  padding: 10px 12px;
  color: var(--ink);
  background: var(--paper-strong);
}

.ranger-harvest__header,
.ranger-harvest__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-color: var(--line);
}

.ranger-harvest__header {
  border-bottom: 1px solid var(--line);
}

.ranger-harvest__footer {
  justify-content: flex-end;
  border-top: 1px solid var(--line);
}

.ranger-harvest__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ranger-harvest__grid > div {
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 10px 12px;
}

.ranger-harvest__grid span {
  color: var(--ink-soft);
  font-size: 11px;
}

.ranger-harvest__grid strong {
  color: var(--ink);
  font-size: 13px;
}

@media (max-width: 1240px) {
  .ranger-tree-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }

  .ranger-session {
    grid-template-columns: minmax(210px, 1fr) auto;
  }

  .ranger-session__controls {
    grid-column: 1 / -1;
    flex-direction: row;
  }
}

@container (max-width: 700px) {
  .ranger-dashboard__scroll {
    padding: 12px 12px 24px;
  }

  .ranger-dashboard__summary {
    padding: 16px;
  }

  .ranger-dashboard__identity {
    align-items: flex-start;
  }

  .ranger-session,
  .ranger-session:not(.ranger-session--active) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .ranger-session__clock,
  .ranger-session__empty-note {
    min-width: 0;
    max-width: none;
    text-align: left;
  }

  .ranger-tree-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-height: 680px) {
  .ranger-dashboard__scroll {
    padding-top: 12px;
  }
}
</style>
