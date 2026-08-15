<template>
  <section class="map-workspace">
    <div ref="mapContainer" class="map-workspace__canvas" :style="mapStyle">
      <header class="map-workspace__header paper-panel">
        <div class="paper-label">密涅瓦图志 · 技能地图</div>
        <h2 class="display-title mt-1 text-2xl">沿着长期实践，辨认自己的疆域</h2>
        <p class="mt-2 text-xs leading-5" style="color: var(--ink-soft)">
          每处地标代表一项正在培养的技能。拖动可整理位置，点击进入对应森林。
        </p>
      </header>

      <div class="map-workspace__legend paper-panel">
        <div>
          <strong>{{ store.skillSummaries.length }}</strong
          ><span>技能地标</span>
        </div>
        <div>
          <strong>{{ totalActions }}</strong
          ><span>行动路径</span>
        </div>
        <div>
          <strong>{{ totalTrees }}</strong
          ><span>累计树木</span>
        </div>
      </div>

      <button
        v-for="(skill, index) in store.skillSummaries"
        :key="skill.id"
        type="button"
        class="map-marker"
        :class="{ 'map-marker--flip': (skill.x || 50) > 68 }"
        :style="{
          '--marker-x': (skill.x || 50) + '%',
          '--marker-y': (skill.y || 50) + '%',
        }"
        :aria-label="'进入技能森林：' + skill.name"
        @pointerdown.stop.prevent="startDrag($event, skill)"
        @click.stop="enterSkillForest(skill)"
      >
        <span class="map-marker__pin" aria-hidden="true"
          ><span class="map-marker__number">{{ index + 1 }}</span></span
        >
        <span class="map-marker__label">
          <strong>{{ skill.name }}</strong>
          <small>{{ skill.actionCount }} 个行动 · {{ skill.totalTrees }} 棵树</small>
        </span>
      </button>

      <div v-if="store.skillSummaries.length === 0" class="map-workspace__empty paper-panel">
        <div class="paper-label">地图尚未落笔</div>
        <h3 class="display-title mt-2 text-xl">先从左侧建立一项技能</h3>
        <p class="mt-2 text-sm" style="color: var(--ink-soft)">
          当技能出现，它会成为这张图志上的第一处地标。
        </p>
      </div>

      <footer class="map-workspace__footer">
        当前版本以技能地标展示长期积累；地点发现与场景解锁将在后续版本继续生长。
      </footer>
    </div>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
import { useActionStore } from '@/stores/actionStore'
import { useAppStore } from '@/stores/appStore'
import mapImage from '@/assets/map.png'

const appStore = useAppStore()
const actionStore = useActionStore()
const actionWorkflow = useActionWorkflow()
const store = reactive({
  ...storeToRefs(appStore),
  ...storeToRefs(actionStore),
  openSkillForest: actionWorkflow.openSkillForest,
})

const mapContainer = ref(null)
const mapStyle = { backgroundImage: `url(${mapImage})` }
const totalActions = computed(() =>
  store.skillSummaries.reduce((sum, skill) => sum + skill.actionCount, 0),
)
const totalTrees = computed(() =>
  store.skillSummaries.reduce((sum, skill) => sum + skill.totalTrees, 0),
)

let isDragging = false
let hasMoved = false
let dragSkill = null

const startDrag = (event, skill) => {
  isDragging = true
  hasMoved = false
  dragSkill = skill
  event.currentTarget?.setPointerCapture?.(event.pointerId)
  document.addEventListener('pointermove', onDrag)
  document.addEventListener('pointerup', stopDrag)
  document.addEventListener('pointercancel', stopDrag)
}

const onDrag = (event) => {
  if (!isDragging || !dragSkill || !mapContainer.value) return
  hasMoved = true
  const rect = mapContainer.value.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  dragSkill.x = Math.max(7, Math.min(93, x))
  const minimumY = rect.width <= 720 ? 34 : 28
  dragSkill.y = Math.max(minimumY, Math.min(86, y))
}

const stopDrag = () => {
  isDragging = false
  dragSkill = null
  document.removeEventListener('pointermove', onDrag)
  document.removeEventListener('pointerup', stopDrag)
  document.removeEventListener('pointercancel', stopDrag)
}

const enterSkillForest = (skill) => {
  if (hasMoved) {
    hasMoved = false
    return
  }
  if (store.openSkillForest) store.openSkillForest(skill.id)
  else {
    store.activeSkillId = skill.id
    store.activeView = 'forest'
  }
}
</script>

<style scoped>
.map-workspace {
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  padding: 16px 18px 18px;
  overflow: hidden;
}

.map-workspace__canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(82, 61, 39, 0.42);
  border-radius: 14px;
  background-color: #c9b890;
  background-position: center;
  background-size: cover;
  box-shadow:
    inset 0 0 80px rgba(49, 36, 23, 0.28),
    var(--shadow-paper);
  isolation: isolate;
}

.map-workspace__canvas::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  content: '';
  background:
    linear-gradient(180deg, rgba(242, 228, 192, 0.08), rgba(63, 55, 38, 0.18)),
    radial-gradient(circle at center, transparent 40%, rgba(65, 48, 28, 0.18));
  pointer-events: none;
}

.map-workspace__header {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 20;
  width: min(520px, 52%);
  padding: 16px 18px;
  text-align: left;
}

.map-workspace__legend {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 20;
  display: grid;
  min-width: 270px;
  grid-template-columns: repeat(3, 1fr);
  padding: 10px;
}

.map-workspace__legend div {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid var(--line);
  padding: 4px 10px;
}

.map-workspace__legend div:last-child {
  border-right: 0;
}

.map-workspace__legend strong {
  color: var(--forest-deep);
  font-family: var(--font-display);
  font-size: 18px;
}

.map-workspace__legend span {
  margin-top: 2px;
  color: var(--ink-soft);
  font-size: 9px;
}

.map-marker {
  position: absolute;
  top: clamp(28%, var(--marker-y), 86%);
  left: clamp(7%, var(--marker-x), 93%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0;
  color: var(--ink);
  background: transparent;
  cursor: grab;
  transform: translate(-18px, -18px);
  transition: transform 150ms ease;
}

.map-marker:hover {
  z-index: 30;
  transform: translate(-18px, -20px);
}

.map-marker--flip {
  flex-direction: row-reverse;
  transform: translate(calc(-100% + 18px), -18px);
}

.map-marker--flip:hover {
  transform: translate(calc(-100% + 18px), -20px);
}

.map-marker:active {
  cursor: grabbing;
}

.map-marker__pin {
  position: relative;
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border: 2px solid #f3e8c9;
  border-radius: 50% 50% 50% 6px;
  color: #f7ecd2;
  background: #4d5b3d;
  box-shadow: 0 4px 10px rgba(48, 37, 25, 0.34);
  font-size: 11px;
  font-weight: 800;
  transform: rotate(-45deg);
}

.map-marker__number {
  display: block;
  transform: rotate(45deg);
}

.map-marker__label {
  display: flex;
  min-width: 140px;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid rgba(93, 73, 45, 0.38);
  border-radius: 4px 10px 10px 4px;
  padding: 7px 10px;
  color: #3a3328;
  background: rgba(246, 235, 207, 0.92);
  box-shadow: 0 4px 12px rgba(57, 43, 27, 0.18);
  backdrop-filter: blur(4px);
}

.map-marker__label strong {
  max-width: 180px;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-marker__label small {
  margin-top: 2px;
  color: #756a58;
  font-size: 9px;
}

.map-workspace__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  padding: 24px;
  text-align: center;
  transform: translate(-50%, -50%);
}

.map-workspace__footer {
  position: absolute;
  right: 18px;
  bottom: 14px;
  max-width: 460px;
  border: 1px solid rgba(83, 64, 40, 0.32);
  border-radius: 8px;
  padding: 8px 12px;
  color: #5c513f;
  background: rgba(244, 232, 203, 0.86);
  font-size: 10px;
  line-height: 1.5;
}

@media (max-width: 1180px) {
  .map-workspace__header {
    width: 48%;
  }

  .map-workspace__legend {
    min-width: 230px;
  }
}

@container (max-width: 720px) {
  .map-workspace {
    padding: 10px;
  }

  .map-workspace__header {
    top: 12px;
    right: 12px;
    left: 12px;
    width: auto;
    padding: 12px 14px;
  }

  .map-workspace__header h2 {
    font-size: 20px;
  }

  .map-workspace__legend {
    top: 132px;
    right: auto;
    left: 12px;
    min-width: 250px;
    padding: 7px;
  }

  .map-workspace__legend div {
    padding-inline: 7px;
  }

  .map-marker__label {
    min-width: 118px;
    max-width: 150px;
  }

  .map-marker {
    top: clamp(34%, var(--marker-y), 86%);
  }

  .map-marker__label strong {
    max-width: 130px;
  }

  .map-workspace__footer {
    right: 12px;
    bottom: 10px;
    max-width: calc(100% - 24px);
  }
}

@media (max-height: 640px) {
  .map-workspace__header p,
  .map-workspace__footer {
    display: none;
  }

  .map-workspace__legend {
    top: 92px;
  }
}
</style>
