<template>
  <div 
    class="flex h-screen w-screen font-sans overflow-hidden transition-colors duration-500"
    :class="store.isNightMode ? 'bg-melvor-dark text-gray-200' : 'bg-gray-100 text-gray-900'"
  >
    <Sidebar class="hidden md:flex shadow-2xl z-20" />

    <Transition name="slide-fade">
      <div v-if="showMobileMenu" class="fixed inset-0 z-50 md:hidden flex">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showMobileMenu = false"></div>
        
        <Sidebar class="relative h-full w-72 shadow-2xl" />
        
        <button @click="showMobileMenu = false" class="absolute top-4 left-[19rem] text-white bg-black/50 p-2 rounded-full">
          ✕
        </button>
      </div>
    </Transition>

    <main 
      class="flex-1 flex flex-col relative transition-all duration-500 ease-in-out bg-no-repeat bg-bottom"
      :class="store.isNightMode ? 'bg-[#0f172a]' : 'bg-[#e0f2fe]'" 
      :style="backgroundStyle"
      style="padding-top: var(--sat); padding-bottom: var(--sab);" 
    >
      
      <button 
        @click="showMobileMenu = true"
        class="md:hidden absolute top-4 left-4 z-40 p-2 rounded-full bg-white/30 border border-white/20 backdrop-blur-md shadow-lg active:scale-95 transition-all"
        :class="store.isNightMode ? 'text-white bg-black/30' : 'text-gray-800'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <button 
        @click="store.toggleNightMode"
        class="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 shadow-lg group"
      >
        <span class="text-xl inline-block group-hover:animate-spin-slow origin-center">{{ store.isNightMode ? '🌛' : '☀️' }}</span>
      </button>

      <div class="flex-1 flex flex-col relative z-10 pb-16 md:pb-0"> 
          <ShopView v-if="store.activeView === 'shop'" />
          <ForestView v-else-if="store.activeView === 'forest'" />
          <NotebookView v-else-if="store.activeView === 'notebook'" /> 
          
          <IdleDashboard v-else-if="store.activeView === 'dashboard' && store.activeProjectId" />
          
          <div v-else class="flex-1 flex flex-col items-center justify-center">
            <div class="text-6xl mb-4 opacity-50">⬅️</div>
            <p class="text-xl">Select a Project</p>
          </div>
      </div>

      <div 
        class="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] z-50 border-t backdrop-blur-xl flex justify-around items-center px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors duration-300"
        :class="store.isNightMode ? 'bg-[#1a1a1a]/90 border-gray-700' : 'bg-white/90 border-gray-200'"
      >
         <button @click="store.openShop()" :class="bottomNavClass('shop')">
           <span class="text-2xl mb-0.5">🏪</span>
           <span class="text-[10px] font-bold uppercase">Shop</span>
         </button>
         
         <button @click="store.openForest()" :class="bottomNavClass('forest')">
           <div class="bg-green-600 rounded-full p-3 -mt-8 shadow-lg border-4 border-opacity-20" 
                :class="store.activeView === 'forest' ? 'border-green-300 scale-110' : 'border-transparent'">
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
        <div v-if="store.offlineEarnings" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          
          <div class="relative rounded-2xl shadow-2xl p-6 max-w-sm w-full border overflow-hidden animate-in zoom-in duration-300"
               :class="store.isNightMode ? 'bg-[#1a1a1a] text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-200'">
              
              <div class="text-center mb-6">
                <div class="text-4xl mb-2 animate-bounce">🌱</div>
                <h2 class="text-xl font-bold mb-2">欢迎回来!</h2>
                <p class="text-sm opacity-70">
                  你离开了 
                  <span class="font-bold text-blue-500">{{ formatDuration(store.offlineEarnings.secondsPassed) }}</span>
                </p>
              </div>

              <div class="rounded-xl p-4 mb-6 flex justify-between items-center border"
                   :class="store.isNightMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'">
                 <div class="flex items-center gap-3">
                    <img :src="store.offlineEarnings.tree.icon" class="w-10 h-10 object-contain pixel-art shadow-sm">
                    <div class="text-left">
                       <div class="font-bold text-sm">{{ store.offlineEarnings.tree.name }}</div>
                       <div class="text-xs text-green-500 font-bold">+ {{ store.offlineEarnings.completedCycles }} 棵</div>
                    </div>
                 </div>
                 <div class="text-right">
                    <div class="text-xs opacity-60">获得经验</div>
                    <div class="font-bold text-blue-500">
                      +{{ store.offlineEarnings.completedCycles * store.offlineEarnings.tree.xp }} XP
                    </div>
                 </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <button @click="store.discardOfflineEarnings()" 
                        class="py-3 rounded-xl border font-bold text-xs transition-colors"
                        :class="store.isNightMode 
                          ? 'border-gray-600 hover:bg-red-900/20 text-gray-400 hover:text-red-400' 
                          : 'border-gray-300 hover:bg-red-50 text-gray-500 hover:text-red-500'">
                   🗑️ 没在工作 (丢弃)
                </button>
                <button @click="store.claimOfflineEarnings()" 
                        class="py-3 rounded-xl bg-green-600 text-white font-bold text-xs shadow-lg hover:bg-green-500 hover:scale-105 transition-all">
                   ✅ 收下成果
                </button>
              </div>
          </div>
        </div>
      </Transition>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import IdleDashboard from './components/IdleDashboard.vue'
import ShopView from './components/ShopView.vue'
import ForestView from './components/ForestView.vue'
import NotebookView from './components/NotebookView.vue'
import { useGameStore } from '@/stores/gameStore'
import bgDay from '@/assets/bg-day.png'   
import bgNight from '@/assets/bg-night.png'

const store = useGameStore()
const showMobileMenu = ref(false) 

// 初始化认证
onMounted(() => {
  store.initAuth()
})

const backgroundStyle = computed(() => {
  const img = store.isNightMode ? bgNight : bgDay
  return { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center bottom' }
})

const bottomNavClass = (view) => {
  const isActive = store.activeView === view
  const base = "flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 "
  
  if (view === 'forest') return base + (store.isNightMode ? 'text-gray-400' : 'text-gray-600')
  
  const activeColor = store.isNightMode ? 'text-green-400' : 'text-emerald-600'
  const inactiveColor = store.isNightMode ? 'text-gray-500' : 'text-gray-400'
  
  return base + (isActive ? activeColor : inactiveColor)
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