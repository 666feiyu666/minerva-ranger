<template>
  <div class="flex-1 p-6 flex flex-col h-full overflow-hidden bg-[#1a1a1a]">
    
    <div class="bg-melvor-panel border border-melvor-border rounded-lg p-6 mb-6 shadow-xl shrink-0">
       <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-4">
            <div class="bg-[#333] p-4 rounded-lg text-4xl shadow-inner border border-[#444]">
              {{ store.activeProject.icon }}
            </div>
            <div>
              <div class="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Project</div>
              <h2 class="text-3xl font-bold text-white tracking-wide">{{ store.activeProject.name }}</h2>
              <div class="flex items-center gap-3 mt-1">
                 <span class="px-2 py-0.5 rounded bg-blue-900/50 border border-blue-800 text-blue-200 font-bold text-xs">Lv. {{ store.activeProject.level }}</span>
                 <span class="text-sm text-gray-400">XP Multiplier: <span class="text-yellow-400 font-bold">x{{ yieldMultiplier }}</span></span>
              </div>
            </div>
          </div>
       </div>

       <div class="relative h-14 bg-[#0f0f0f] rounded border border-melvor-border overflow-hidden mt-4 group">
          
          <template v-if="store.activeProjectId === store.runningProjectId">
              <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-900 to-emerald-600 transition-all duration-1000 ease-linear" 
                   :style="{ width: store.progressPercentage + '%' }">
              </div>
              <div class="absolute inset-0 flex items-center justify-between px-6 z-10">
                 <div class="flex items-center gap-3">
                    <span v-if="store.isRunning" class="animate-bounce text-2xl">🚿</span>
                    <span class="font-bold text-gray-200 text-lg tracking-wide drop-shadow-md">
                       {{ store.activeTree ? `Growing: ${store.activeTree.name}` : 'Ready...' }}
                    </span>
                    <span v-if="!store.isRunning && store.timer > 0" class="text-xs text-yellow-500 font-bold border border-yellow-700 px-2 py-0.5 rounded bg-yellow-900/30">
                      PAUSED
                    </span>
                 </div>
                 <span class="font-mono text-xl text-white font-bold" v-if="store.activeTree">
                   {{ formatTime(store.timer) }} / {{ formatTime(store.activeTree.time) }}
                 </span>
              </div>
          </template>

          <template v-else>
               <div class="absolute inset-0 flex items-center justify-center text-gray-500 text-sm font-bold uppercase tracking-widest z-10">
                   Waiting to grow...
               </div>
          </template>

       </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <h3 class="text-gray-400 text-sm font-bold uppercase tracking-widest mb-3 px-1">Your Inventory</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        <div v-for="tree in store.inventoryTrees" :key="tree.id" 
             @click="store.startAction(tree.id)"
             :class="['relative bg-melvor-panel border-2 rounded-lg p-4 transition-all cursor-pointer group select-none hover:-translate-y-1',
             isTreeActive(tree.id) ? 'border-green-500 bg-[#2a302a]' : 'border-melvor-border hover:border-gray-500 hover:bg-[#2a2a2a]']"
        >
           <div class="flex flex-col items-center text-center">
              <div class="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{{ tree.icon }}</div>
              <h3 class="text-lg font-bold text-gray-100 mb-1">{{ tree.name }}</h3>
              
              <div class="w-full space-y-1 mb-3 text-xs opacity-80">
                 <div class="flex justify-between items-center bg-black/20 p-1 px-2 rounded">
                     <span class="text-gray-500">XP</span> 
                     <span class="text-blue-400 font-bold">+{{ store.getTreeYield(tree, store.activeProject).xp }}</span>
                 </div>
              </div>

              <button class="w-full py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors"
                @click.stop="handleButtonClick(tree)"
                :class="getButtonClass(tree)">
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
const yieldMultiplier = computed(() => store.getTreeYield(store.inventoryTrees[0], store.activeProject).multiplier)
const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

// 辅助判断：某棵树是否在【当前视图项目】中处于激活状态
const isTreeActive = (treeId) => {
    return store.activeTreeId === treeId && store.activeProjectId === store.runningProjectId
}

const getButtonText = (tree) => {
  // 只有当这棵树属于 正在运行的项目 时，才显示 Pause/Resume
  if (isTreeActive(tree.id)) {
      return store.isRunning ? 'Pause' : 'Resume'
  }
  return 'Grow'
}

const getButtonClass = (tree) => {
  if (isTreeActive(tree.id)) {
      return store.isRunning 
        ? 'bg-yellow-700 text-white hover:bg-yellow-600' 
        : 'bg-green-700 text-white hover:bg-green-600 animate-pulse'
  }
  return 'bg-gray-700 text-gray-300 hover:bg-gray-600'
}

const handleButtonClick = (tree) => {
  // 如果点击的是当前正在跑的树 -> 暂停
  if (isTreeActive(tree.id)) {
      store.toggleAction()
  } else {
      // 否则 -> 开启新任务（Store 会自动停止旧项目的任务）
      store.startAction(tree.id)
  }
}
</script>