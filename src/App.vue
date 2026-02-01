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
const showMobileMenu = ref(false) // 控制手机端抽屉状态

// [新增] 初始化认证
onMounted(() => {
  store.initAuth()
})

// ... 原有的 backgroundStyle ...
const backgroundStyle = computed(() => {
  const img = store.isNightMode ? bgNight : bgDay
  return { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center bottom' }
})

// 底部导航栏样式辅助函数
const bottomNavClass = (view) => {
  const isActive = store.activeView === view
  const base = "flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 "
  
  if (view === 'forest') return base + (store.isNightMode ? 'text-gray-400' : 'text-gray-600')
  
  const activeColor = store.isNightMode ? 'text-green-400' : 'text-emerald-600'
  const inactiveColor = store.isNightMode ? 'text-gray-500' : 'text-gray-400'
  
  return base + (isActive ? activeColor : inactiveColor)
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
</style>