<template>
  <div 
    class="flex h-screen w-screen font-sans overflow-hidden transition-colors duration-500"
    :class="store.isNightMode ? 'bg-melvor-dark text-gray-200' : 'bg-gray-100 text-gray-900'"
  >
    <Sidebar />
    
    <main 
      class="flex-1 flex flex-col relative transition-all duration-500 ease-in-out bg-no-repeat bg-bottom"
      :class="store.isNightMode ? 'bg-[#0f172a]' : 'bg-[#e0f2fe]'" 
      :style="backgroundStyle"
    >
      
      <button 
        @click="store.toggleNightMode"
        class="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 shadow-lg group"
        :title="store.isNightMode ? 'Switch to Day' : 'Switch to Night'"
      >
        <span class="text-xl inline-block group-hover:animate-spin-slow origin-center">{{ store.isNightMode ? '🌛' : '☀️' }}</span>
      </button>

      <div class="flex-1 flex flex-col relative z-10">
          <ShopView v-if="store.activeView === 'shop'" />
          <ForestView v-else-if="store.activeView === 'forest'" />
          <NotebookView v-else-if="store.activeView === 'notebook'" /> 
          
          <IdleDashboard v-else-if="store.activeView === 'dashboard' && store.activeProjectId" />
          
          <div v-else class="flex-1 flex flex-col items-center justify-center transition-colors"
               :class="store.isNightMode ? 'text-gray-600' : 'text-gray-500/80 font-bold'">
            <div class="text-6xl mb-4 opacity-50">⬅️</div>
            <p class="text-xl">Select a Project to Start</p>
            <p class="text-sm mt-2">Or visit the Shop to buy new seeds</p>
          </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Sidebar from './components/Sidebar.vue'
import IdleDashboard from './components/IdleDashboard.vue'
import ShopView from './components/ShopView.vue'
import ForestView from './components/ForestView.vue'
import NotebookView from './components/NotebookView.vue'
import { useGameStore } from '@/stores/gameStore'

import bgDay from '@/assets/bg-day.png'   
import bgNight from '@/assets/bg-night.png'

const store = useGameStore()

const backgroundStyle = computed(() => {
  const img = store.isNightMode ? bgNight : bgDay
  return {
    backgroundImage: `url(${img})`,
    backgroundSize: '100% auto', 
  }
})
</script>

<style>
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}
</style>