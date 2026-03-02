<template>
  <div class="flex-1 p-6 flex flex-col h-full overflow-hidden bg-transparent relative">
    
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
              <div class="text-xs uppercase tracking-widest mb-1 font-bold transition-colors"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
                Current Project
              </div>
              <h2 class="text-3xl font-bold tracking-wide transition-colors duration-300"
                :class="store.isNightMode ? 'text-white' : 'text-gray-800'">
                {{ store.activeProject?.name || '未选择项目' }}
              </h2>
              
             <div class="flex items-center gap-3 mt-2">
                  <span class="px-2 py-0.5 rounded border font-bold text-xs transition-colors"
                      :class="store.isNightMode ? 'bg-blue-900/40 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-600'">
                      Lv. {{ store.activeProject?.level || 1 }}
                  </span>
                  <span class="px-2 py-0.5 rounded border font-bold text-xs flex items-center gap-1 transition-colors"
                      :class="store.isNightMode ? 'bg-green-900/40 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-emerald-600'">
                      <span>🌲</span>{{ store.activeProject?.totalTrees || 0 }}
                  </span>
                  <span class="px-2 py-0.5 rounded border font-bold text-xs flex items-center gap-1 transition-colors"
                      :class="store.isNightMode ? 'bg-purple-900/40 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-600'">
                      <span>⏱️</span>{{ formatDuration(store.activeProject?.totalTimeSpent) }}
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
                :class="[
                  isHarvestReady 
                    ? (store.timer >= store.MAX_PLANTING_TIME ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.8)]' : 'bg-gradient-to-r from-green-500 to-emerald-400 animate-pulse shadow-[0_0_30px_rgba(52,211,153,0.8)]')
                    : (store.isNightMode ? 'bg-gradient-to-r from-emerald-900 to-emerald-600' : 'bg-gradient-to-r from-emerald-300 to-emerald-500')
                ]"
                :style="{ width: store.progressPercentage + '%' }"
              ></div>
              
              <div class="absolute inset-0 flex items-center justify-between px-6 z-10">
                 <div class="flex items-center gap-3">
                    <img 
                      v-if="store.isRunning && store.activeTree && store.timer < store.MAX_PLANTING_TIME" 
                      :src="store.activeTree.icon"
                      class="h-8 w-8 object-contain pixel-art animate-bounce filter drop-shadow-md" 
                    />
                    <span v-else-if="store.activeTree" class="text-2xl">🌱</span>

                    <span 
                      class="font-bold text-lg tracking-wide drop-shadow-md transition-colors"
                      :class="isHarvestReady ? (store.timer >= store.MAX_PLANTING_TIME ? 'text-red-900 animate-pulse' : 'text-green-900 drop-shadow-sm') : (store.isNightMode ? 'text-gray-200' : 'text-gray-800')"
                    >
                       <template v-if="store.timer >= store.MAX_PLANTING_TIME">
                         [ CAPACITY MAXED // HARVEST REQUIRED ]
                       </template>
                       <template v-else-if="isHarvestReady">
                         [ READY TO HARVEST ]
                       </template>
                       <template v-else>
                         {{ store.activeTree ? `种植: ${store.activeTree.name}` : 'Ready...' }}
                       </template>
                    </span>
                    
                    <span v-if="!store.isRunning && store.timer > 0 && !isHarvestReady" 
                          class="text-xs font-bold px-2 py-0.5 rounded border animate-pulse"
                          :class="store.isNightMode 
                            ? 'text-yellow-500 border-yellow-700 bg-yellow-900/30' 
                            : 'text-yellow-700 border-yellow-400 bg-yellow-100'">
                      PAUSED
                    </span>
                 </div>
                 
                 <span 
                   class="font-mono text-xl font-bold transition-colors"
                   :class="isHarvestReady ? (store.timer >= store.MAX_PLANTING_TIME ? 'text-red-900' : 'text-green-900') : (store.isNightMode ? 'text-white' : 'text-gray-700')" 
                   v-if="store.activeTree"
                 >
                   {{ formatTime(store.timer) }} / {{ formatTime(store.activeTree.time) }}
                 </span>
              </div>
          </template>

          <template v-else>
               <div class="absolute inset-0 flex items-center justify-center text-sm font-bold uppercase tracking-widest z-10 transition-colors"
                 :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'">
                   Waiting to grow...
               </div>
          </template>
       </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <h3 class="text-sm font-bold uppercase tracking-widest mb-4 px-1 transition-colors"
        :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
        Your Inventory
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-24">
        <div v-for="tree in store.inventoryTrees" :key="tree.id" 
             @click="handleButtonClick(tree)"
             class="relative border-2 rounded-2xl p-5 transition-all cursor-pointer group select-none hover:-translate-y-1 backdrop-blur-sm shadow-md"
             :class="getCardClass(tree.id)"
        >
           <div class="flex flex-col items-center text-center">
              <div class="mb-4 transform group-hover:scale-110 transition-transform filter drop-shadow-md h-16 flex items-center justify-center">
                <img :src="tree.icon" class="h-full w-auto object-contain pixel-art" alt="Tree Icon" />
              </div>
              
              <h3 class="text-lg font-bold mb-1 transition-colors"
                :class="store.isNightMode ? 'text-gray-100' : 'text-gray-800'">
                {{ tree.name }}
              </h3>
              
              <div class="w-full space-y-2 mb-4 text-xs font-medium">
                 <div class="flex justify-between items-center px-3 py-1.5 rounded transition-colors"
                   :class="store.isNightMode ? 'bg-black/20 text-gray-400' : 'bg-gray-100 text-gray-500'">
                     <span>XP Gain</span> 
                     <span class="font-bold text-sm" :class="store.isNightMode ? 'text-blue-400' : 'text-blue-600'">
                       +{{ store.getTreeYield(tree, store.activeProject).xp }}
                     </span>
                 </div>
              </div>

              <button 
                class="w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                @click.stop="handleButtonClick(tree)"
                :class="getButtonClass(tree)"
              >
                <span v-if="getButtonText(tree) !== '>_ CLAIM'">{{ getButtonIcon(tree) }}</span>
                {{ getButtonText(tree) }}
              </button>
           </div>
        </div>
      </div>
    </div>

    <div v-if="showHarvestModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <div class="w-full max-w-2xl bg-[#0a0a0a] border-2 border-green-500/50 rounded-lg shadow-[0_0_40px_rgba(34,197,94,0.15)] overflow-hidden font-mono text-green-500 flex flex-col">
        
        <div class="bg-green-900/30 px-4 py-2 text-xs text-green-400 border-b border-green-800/50 flex justify-between items-center">
          <span class="animate-pulse">TERMINAL // RANGER_NOTES.EXE</span>
          <button @click="closeHarvestModal" class="hover:text-white transition-colors">[_X]</button>
        </div>

        <div class="p-6 text-sm md:text-base space-y-4">
          <div class="space-y-1">
             <p>> SYSTEM: HARVEST PROTOCOL INITIATED...</p>
             <p>> TARGET_PROJECT: <span class="text-white font-bold">{{ store.runningProject?.name }}</span></p>
             <p>> DURATION_LOGGED: <span class="text-white font-bold">{{ formatTime(store.timer) }}</span></p>
             <p>> YIELD_CALCULATED: <span class="text-white font-bold">{{ harvestCycles }}x {{ store.activeTree?.name }}</span></p>
             <p v-if="store.timer >= store.MAX_PLANTING_TIME" class="text-red-500">> WARNING: MAX CAPACITY REACHED. TIME CAPPED AT 3 HOURS.</p>
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
             <p class="text-xs mt-2 text-green-700">1 字 = 1 金币</p>
          </div>
        </div>

        <div class="p-4 border-t border-green-800/50 flex justify-end gap-4 bg-[#050505]">
          <button @click="closeHarvestModal" class="px-5 py-2 text-green-700 hover:text-green-500 transition-colors">
            ABORT
          </button>
          <button @click="confirmHarvest" class="px-6 py-2 bg-green-900/40 border border-green-600 text-green-400 hover:bg-green-800 hover:text-white transition-all rounded shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            EXECUTE_UPLOAD
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

// --- Modal 状态管理 ---
const showHarvestModal = ref(false)
const logContent = ref('')

// 计算是否满足收获条件（时间达标）
const isHarvestReady = computed(() => {
  return store.activeTree && store.timer >= store.maxTime && store.activeProjectId === store.runningProjectId
})

// 计算本次总共完成了多少轮（正向计时倍数）
const harvestCycles = computed(() => {
  if (!store.activeTree) return 0
  return Math.floor(store.timer / store.activeTree.time)
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
const getCardClass = (treeId) => {
  if (isTreeActive(treeId)) {
    if (isHarvestReady.value) {
      if (store.timer >= store.MAX_PLANTING_TIME) {
          return store.isNightMode 
            ? 'border-red-600 bg-[#3a1a1a] shadow-[0_0_20px_rgba(220,38,38,0.3)]'
            : 'border-red-500 bg-red-50 shadow-[0_0_20px_rgba(220,38,38,0.4)] ring-2 ring-red-400/30'
      }
      return store.isNightMode
        ? 'border-green-500 bg-[#162a1a] shadow-[0_0_20px_rgba(34,197,94,0.2)]'
        : 'border-green-500 bg-green-50 shadow-[0_0_20px_rgba(34,197,94,0.3)] ring-2 ring-green-400/30'
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
          if (store.timer >= store.MAX_PLANTING_TIME) {
              return 'bg-[#0a0a0a] text-red-400 border border-red-500 font-mono font-bold hover:bg-red-900 hover:text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse'
          }
          return 'bg-[#0a0a0a] text-green-400 border border-green-500 font-mono font-bold hover:bg-green-900 hover:text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse'
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
const handleButtonClick = (tree) => {
  if (isTreeActive(tree.id)) {
      if (isHarvestReady.value) {
          store.stopTimer()
          logContent.value = ''
          showHarvestModal.value = true
      } else {
          store.toggleAction()
      }
  } else {
      store.startAction(tree.id)
  }
}

const closeHarvestModal = () => {
  showHarvestModal.value = false
  logContent.value = ''
}

const confirmHarvest = () => {
  store.submitHarvest(logContent.value)
  showHarvestModal.value = false
  logContent.value = ''
}
</script>

<style scoped>
.pixel-art {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 20px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }

/* 终端风格滚动条 */
.custom-scrollbar-terminal::-webkit-scrollbar { width: 6px; }
.custom-scrollbar-terminal::-webkit-scrollbar-track { background: #000; }
.custom-scrollbar-terminal::-webkit-scrollbar-thumb { background-color: #166534; border-radius: 4px; }
.custom-scrollbar-terminal::-webkit-scrollbar-thumb:hover { background-color: #22c55e; }
</style>