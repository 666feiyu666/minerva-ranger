<template>
  <div class="flex-1 p-6 flex flex-col h-full overflow-hidden bg-transparent">
    
    <div 
      class="rounded-2xl p-6 mb-6 shadow-lg shrink-0 border backdrop-blur-md transition-all duration-300"
      :class="store.isNightMode 
        ? 'bg-[#1a1a1a]/80 border-gray-700' 
        : 'bg-white/70 border-white/60 shadow-xl ring-1 ring-black/5'"
    >
       <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-5">
            <div 
              class="p-4 rounded-xl text-4xl shadow-inner border transition-colors duration-300"
              :class="store.isNightMode 
                ? 'bg-[#333] border-[#444] text-gray-200' 
                : 'bg-white border-gray-200 text-gray-800 shadow-sm'"
            >
              {{ store.activeProject?.icon || '📁' }}
            </div>
            
            <div>
              <div 
                class="text-xs uppercase tracking-widest mb-1 font-bold transition-colors"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                Current Project
              </div>
              <h2 
                class="text-3xl font-bold tracking-wide transition-colors duration-300"
                :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
              >
                {{ store.activeProject?.name || '未选择项目' }}
              </h2>
              
              <div class="flex items-center gap-3 mt-2">
                 <span 
                   class="px-2 py-0.5 rounded border font-bold text-xs transition-colors"
                   :class="store.isNightMode 
                     ? 'bg-blue-900/40 border-blue-800 text-blue-300' 
                     : 'bg-blue-50 border-blue-200 text-blue-600'"
                 >
                   Lv. {{ store.activeProject?.level || 1 }}
                 </span>
                 
                 <span 
                   class="px-2 py-0.5 rounded border font-bold text-xs flex items-center gap-1 transition-colors"
                   :class="store.isNightMode 
                     ? 'bg-purple-900/40 border-purple-800 text-purple-300' 
                     : 'bg-purple-50 border-purple-200 text-purple-600'"
                 >
                   <span>⏱️</span>
                   {{ formatDuration(store.activeProject?.totalTimeSpent) }}
                 </span>

                 <span 
                   class="text-sm transition-colors"
                   :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'"
                 >
                   XP Multiplier: 
                   <span 
                     class="font-bold"
                     :class="store.isNightMode ? 'text-yellow-400' : 'text-yellow-600'"
                   >
                     x{{ yieldMultiplier }}
                   </span>
                 </span>
              </div>
            </div>
          </div>
       </div>

       <div 
         class="relative h-14 rounded-xl border overflow-hidden mt-6 group shadow-inner transition-colors duration-300"
         :class="store.isNightMode 
           ? 'bg-[#0f0f0f] border-gray-700' 
           : 'bg-gray-200/50 border-gray-300'"
       >
          <template v-if="store.activeProjectId === store.runningProjectId">
              <div 
                class="absolute top-0 left-0 h-full transition-all duration-100 ease-linear shadow-[0_0_20px_rgba(16,185,129,0.5)]" 
                :class="store.isNightMode 
                  ? 'bg-gradient-to-r from-emerald-900 to-emerald-600' 
                  : 'bg-gradient-to-r from-emerald-300 to-emerald-500'"
                :style="{ width: store.progressPercentage + '%' }"
              ></div>
              
              <div class="absolute inset-0 flex items-center justify-between px-6 z-10">
                 <div class="flex items-center gap-3">
                    <span v-if="store.isRunning" class="animate-bounce text-2xl filter drop-shadow-md">🌲</span>
                    <span 
                      class="font-bold text-lg tracking-wide drop-shadow-md transition-colors"
                      :class="store.isNightMode ? 'text-gray-200' : 'text-gray-800'"
                    >
                       {{ store.activeTree ? `种植: ${store.activeTree.name}` : 'Ready...' }}
                    </span>
                    
                    <span v-if="!store.isRunning && store.timer > 0" 
                          class="text-xs font-bold px-2 py-0.5 rounded border animate-pulse"
                          :class="store.isNightMode 
                            ? 'text-yellow-500 border-yellow-700 bg-yellow-900/30' 
                            : 'text-yellow-700 border-yellow-400 bg-yellow-100'">
                      PAUSED
                    </span>
                 </div>
                 
                 <span 
                   class="font-mono text-xl font-bold transition-colors"
                   :class="store.isNightMode ? 'text-white' : 'text-gray-700'" 
                   v-if="store.activeTree"
                 >
                   {{ formatTime(store.timer) }} / {{ formatTime(store.activeTree.time) }}
                 </span>
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
        
        <div v-for="tree in store.inventoryTrees" :key="tree.id" 
             @click="store.startAction(tree.id)"
             class="relative border-2 rounded-2xl p-5 transition-all cursor-pointer group select-none hover:-translate-y-1 backdrop-blur-sm shadow-md"
             :class="getCardClass(tree.id)"
        >
           <div class="flex flex-col items-center text-center">
              <div class="text-5xl mb-4 transform group-hover:scale-110 transition-transform filter drop-shadow-md">
                {{ tree.icon }}
              </div>
              
              <h3 
                class="text-lg font-bold mb-1 transition-colors"
                :class="store.isNightMode ? 'text-gray-100' : 'text-gray-800'"
              >
                {{ tree.name }}
              </h3>
              
              <div class="w-full space-y-2 mb-4 text-xs font-medium">
                 <div 
                   class="flex justify-between items-center px-3 py-1.5 rounded transition-colors"
                   :class="store.isNightMode ? 'bg-black/20 text-gray-400' : 'bg-gray-100 text-gray-500'"
                 >
                     <span>XP Gain</span> 
                     <span 
                       class="font-bold text-sm"
                       :class="store.isNightMode ? 'text-blue-400' : 'text-blue-600'"
                     >
                       +{{ store.getTreeYield(tree, store.activeProject).xp }}
                     </span>
                 </div>
              </div>

              <button 
                class="w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                @click.stop="handleButtonClick(tree)"
                :class="getButtonClass(tree)"
              >
                <span>{{ getButtonIcon(tree) }}</span>
                {{ getButtonText(tree) }}
              </button>
           </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

// 计算倍率 (做个防御性检查)
const yieldMultiplier = computed(() => {
  if (!store.inventoryTrees || store.inventoryTrees.length === 0) return 1
  return store.getTreeYield(store.inventoryTrees[0], store.activeProject).multiplier
})

// === 格式化函数 ===
const formatTime = (s) => {
  const seconds = Math.floor(s) 
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

const formatDuration = (seconds) => {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// === 状态判断 ===
const isTreeActive = (treeId) => {
    return store.activeTreeId === treeId && store.activeProjectId === store.runningProjectId
}

// === 动态样式逻辑 ===

// 1. 卡片整体样式 (Day/Night 区分)
const getCardClass = (treeId) => {
  const active = isTreeActive(treeId)
  
  if (active) {
    // 激活状态
    return store.isNightMode
      ? 'border-green-500 bg-[#2a302a]/90 shadow-green-900/20'  // 夜间激活
      : 'border-emerald-500 bg-emerald-50/90 shadow-emerald-100 ring-2 ring-emerald-500/20' // 白天激活
  } else {
    // 普通状态
    return store.isNightMode
      ? 'bg-[#1a1a1a]/80 border-gray-700 hover:border-gray-500 hover:bg-[#252525]' // 夜间普通
      : 'bg-white/60 border-white/60 hover:border-emerald-300 hover:bg-white/90'   // 白天普通
  }
}

// 2. 按钮样式
const getButtonClass = (tree) => {
  if (isTreeActive(tree.id)) {
      return store.isRunning 
        ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg' // 暂停 (通用)
        : 'bg-emerald-600 text-white hover:bg-emerald-500 animate-pulse hover:shadow-lg' // 继续 (通用)
  }
  // 未激活状态
  return store.isNightMode
    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200'
}

// 3. 按钮文字与图标
const getButtonText = (tree) => {
  if (isTreeActive(tree.id)) return store.isRunning ? 'Pause' : 'Resume'
  return 'Start'
}

const getButtonIcon = (tree) => {
  if (isTreeActive(tree.id)) return store.isRunning ? '⏸' : '▶'
  return '🌱'
}

// === 交互 ===
const handleButtonClick = (tree) => {
  if (isTreeActive(tree.id)) {
      store.toggleAction()
  } else {
      store.startAction(tree.id)
  }
}
</script>

<style scoped>
/* 滚动条样式适配 */
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
</style>