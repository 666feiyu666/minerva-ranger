<template>
  <div
    class="flex-1 w-full h-full relative overflow-hidden bg-[#e8dcb8] shadow-inner select-none flex flex-col"
  >
    <div
      class="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-8 py-3 rounded-lg border-2 border-[#8b5a2b]/30 bg-[#f4ebd0]/90 backdrop-blur-sm shadow-lg text-center pointer-events-none"
    >
      <h2 class="text-2xl font-serif font-bold text-[#5c3a21] tracking-widest uppercase">
        The Realm of Minerva
      </h2>
      <p class="text-xs text-[#8b5a2b] font-mono mt-1">拖动排列技能 · 点击查看技能下的行动森林</p>
    </div>

    <div
      ref="mapContainer"
      class="w-full h-full relative bg-cover bg-center transition-all duration-700"
      :style="mapStyle"
    >
      <div
        v-for="skill in store.skillSummaries"
        :key="skill.id"
        class="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-grab active:cursor-grabbing"
        :style="{
          left: (skill.x || 50) + '%',
          top: (skill.y || 50) + '%',
        }"
        @pointerdown.stop.prevent="startDrag($event, skill)"
        @click.stop="enterSkillForest(skill)"
      >
        <div
          class="relative flex flex-col items-center justify-center hover:scale-110 transition-transform"
        >
          <div
            class="text-4xl filter drop-shadow-lg group-hover:drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] transition-all"
          >
            🏰
          </div>
          <div
            class="mt-2 px-3 py-1 bg-black/70 backdrop-blur-md rounded border border-[#8b5a2b] text-white text-xs font-bold whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity"
          >
            {{ skill.name }}
          </div>
          <div
            class="mt-1 px-2 py-0.5 rounded bg-black/55 text-[10px] text-emerald-100 whitespace-nowrap"
          >
            {{ skill.actionCount }} 个行动 · {{ skill.totalTrees }} 棵树
          </div>
          <div
            class="mt-1 px-2 py-0.5 rounded bg-black/55 text-[10px] text-sky-100 whitespace-nowrap"
          >
            {{ skill.totalXP }} XP · {{ formatDuration(skill.totalTimeSpent) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { reactive, ref } from 'vue'
import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
import { useAppStore } from '@/stores/appStore'
import { useActionStore } from '@/stores/actionStore'
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
const mapStyle = {
  backgroundImage: `url(${mapImage})`,
  boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
}

const formatDuration = (seconds) => {
  if (!seconds) return '0 分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`
}

// === 拖拽交互逻辑 ===
let isDragging = false
let hasMoved = false
let dragSkill = null

// 开始拖拽
const startDrag = (event, skill) => {
  isDragging = true
  hasMoved = false
  dragSkill = skill

  // 绑定全局事件，确保留在屏幕内也能稳定拖拽
  document.addEventListener('pointermove', onDrag)
  document.addEventListener('pointerup', stopDrag)
  document.addEventListener('pointercancel', stopDrag)
}

// 拖拽移动中
const onDrag = (event) => {
  if (!isDragging || !dragSkill || !mapContainer.value) return

  hasMoved = true // 标记发生了位移

  const rect = mapContainer.value.getBoundingClientRect()
  let x = ((event.clientX - rect.left) / rect.width) * 100
  let y = ((event.clientY - rect.top) / rect.height) * 100

  // 限制坐标在 5% 到 95% 之间，防止手滑把城堡拖出屏幕外找不到了
  dragSkill.x = Math.max(5, Math.min(95, x))
  dragSkill.y = Math.max(5, Math.min(95, y))
}

// 停止拖拽
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
  if (store.openSkillForest) {
    store.openSkillForest(skill.id)
  } else {
    store.activeSkillId = skill.id
    store.activeView = 'forest'
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(139, 90, 43, 0.3);
  border-radius: 20px;
}
</style>
