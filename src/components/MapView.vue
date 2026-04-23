<template>
  <div class="flex-1 w-full h-full relative overflow-hidden bg-[#e8dcb8] shadow-inner select-none flex flex-col">
    
    <div class="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-8 py-3 rounded-lg border-2 border-[#8b5a2b]/30 bg-[#f4ebd0]/90 backdrop-blur-sm shadow-lg text-center pointer-events-none">
      <h2 class="text-2xl font-serif font-bold text-[#5c3a21] tracking-widest uppercase">The Realm of Minerva</h2>
      <p class="text-xs text-[#8b5a2b] font-mono mt-1">Drag to arrange · Click to enter forest overview</p>
    </div>

    <div 
      ref="mapContainer"
      class="w-full h-full relative bg-cover bg-center transition-all duration-700"
      style="background-image: url('/src/assets/map.png'); box-shadow: inset 0 0 100px rgba(0,0,0,0.5);"
    >
      <div 
        v-for="theme in store.themes" 
        :key="theme.id"
        class="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-grab active:cursor-grabbing"
        :style="{ 
          left: (theme.x || 50) + '%', 
          top: (theme.y || 50) + '%' 
        }"
        @pointerdown.stop.prevent="startDrag($event, theme)"
        @click.stop="enterThemeForest(theme)"
      >
        <div class="relative flex flex-col items-center justify-center hover:scale-110 transition-transform">
          <div class="text-4xl filter drop-shadow-lg group-hover:drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] transition-all">
            🏰
          </div>
          <div class="mt-2 px-3 py-1 bg-black/70 backdrop-blur-md rounded border border-[#8b5a2b] text-white text-xs font-bold whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
            {{ theme.name }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const mapContainer = ref(null)

// === 拖拽交互逻辑 ===
let isDragging = false
let hasMoved = false
let dragTheme = null

// 开始拖拽
const startDrag = (event, theme) => {
  isDragging = true
  hasMoved = false
  dragTheme = theme

  // 绑定全局事件，确保留在屏幕内也能稳定拖拽
  document.addEventListener('pointermove', onDrag)
  document.addEventListener('pointerup', stopDrag)
  document.addEventListener('pointercancel', stopDrag)
}

// 拖拽移动中
const onDrag = (event) => {
  if (!isDragging || !dragTheme || !mapContainer.value) return

  hasMoved = true // 标记发生了位移

  const rect = mapContainer.value.getBoundingClientRect()
  let x = ((event.clientX - rect.left) / rect.width) * 100
  let y = ((event.clientY - rect.top) / rect.height) * 100

  // 限制坐标在 5% 到 95% 之间，防止手滑把城堡拖出屏幕外找不到了
  dragTheme.x = Math.max(5, Math.min(95, x))
  dragTheme.y = Math.max(5, Math.min(95, y))
}

// 停止拖拽
const stopDrag = () => {
  isDragging = false
  dragTheme = null
  
  document.removeEventListener('pointermove', onDrag)
  document.removeEventListener('pointerup', stopDrag)
  document.removeEventListener('pointercancel', stopDrag)
}

const enterThemeForest = (theme) => {
  if (hasMoved) {
    hasMoved = false
    return
  }
  if (store.openThemeForest) {
    store.openThemeForest(theme.id)
  } else {
    store.activeThemeId = theme.id
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
