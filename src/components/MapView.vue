<template>
  <div class="flex-1 w-full h-full relative overflow-hidden bg-[#e8dcb8] shadow-inner select-none flex flex-col">
    <div class="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-8 py-3 rounded-lg border-2 border-[#8b5a2b]/30 bg-[#f4ebd0]/90 backdrop-blur-sm shadow-lg text-center pointer-events-none">
      <h2 class="text-2xl font-serif font-bold text-[#5c3a21] tracking-widest uppercase">The Realm of Minerva</h2>
      <p class="text-xs text-[#8b5a2b] font-mono mt-1 mt-1">Select a territory to view your vassals</p>
    </div>

    <div 
      class="w-full h-full relative bg-cover bg-center transition-all duration-700"
      style="background-image: repeating-linear-gradient(45deg, rgba(139, 90, 43, 0.05) 0px, rgba(139, 90, 43, 0.05) 2px, transparent 2px, transparent 10px);"
    >
      <div 
        v-for="theme in store.themes" 
        :key="theme.id"
        class="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
        :style="{ left: theme.x + '%', top: theme.y + '%' }"
        @click="openThemeDetails(theme)"
      >
        <div class="relative flex flex-col items-center justify-center animate-bounce-slow hover:scale-110 transition-transform">
          <div class="text-4xl filter drop-shadow-lg group-hover:drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] transition-all">
            🏰
          </div>
          <div class="mt-2 px-3 py-1 bg-black/70 backdrop-blur-md rounded border border-[#8b5a2b] text-white text-xs font-bold whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
            {{ theme.name }}
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="selectedTheme" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeThemeDetails"></div>
        
        <div class="relative w-full max-w-lg rounded-xl overflow-hidden shadow-2xl transition-all"
             :class="store.isNightMode ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-[#f9f6ef] border-2 border-[#d2b48c]'">
          
          <div class="px-6 py-4 flex justify-between items-center border-b"
               :class="store.isNightMode ? 'bg-[#222] border-gray-800' : 'bg-[#e8dcb8]/50 border-[#d2b48c]'">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🏰</span>
              <div>
                <h3 class="text-xl font-bold font-serif" :class="store.isNightMode ? 'text-white' : 'text-[#5c3a21]'">
                  {{ selectedTheme.name }}
                </h3>
                <p class="text-xs font-mono" :class="store.isNightMode ? 'text-gray-400' : 'text-[#8b5a2b]'">
                  {{ currentThemeProjects.length }} Vassals (Projects)
                </p>
              </div>
            </div>
            <button @click="closeThemeDetails" class="p-2 rounded-full hover:bg-black/10 transition-colors">
              ❌
            </button>
          </div>

          <div class="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
             <div v-if="currentThemeProjects.length === 0" class="text-center py-8 opacity-60 font-mono text-sm">
               此领地尚无封臣，快去左侧栏分配吧。
             </div>
             
             <div class="grid grid-cols-1 gap-3">
               <div v-for="project in currentThemeProjects" :key="project.id"
                    @click="diveIntoProject(project.id)"
                    class="p-4 rounded-lg border-2 flex items-center justify-between cursor-pointer transition-all hover:-translate-y-1 shadow-sm hover:shadow-md"
                    :class="store.isNightMode 
                      ? 'bg-[#252525] border-gray-700 hover:border-blue-500 hover:bg-[#2a2a2a]' 
                      : 'bg-white border-[#e8dcb8] hover:border-[#8b5a2b]'">
                  <div class="flex items-center gap-4">
                    <div class="text-3xl">{{ project.icon || '📁' }}</div>
                    <div>
                      <h4 class="font-bold text-sm" :class="store.isNightMode ? 'text-gray-200' : 'text-gray-800'">
                        {{ project.name }}
                      </h4>
                      <div class="flex items-center gap-3 mt-1 text-xs opacity-80" :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
                        <span>Lv.{{ project.level }}</span>
                        <span>🌲 {{ project.totalTrees }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-blue-500 font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    ➡️
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const selectedTheme = ref(null)

// 获取当前选中主题下的所有项目
const currentThemeProjects = computed(() => {
  if (!selectedTheme.value) return []
  return store.projects.filter(p => p.themeId === selectedTheme.value.id)
})

const openThemeDetails = (theme) => {
  selectedTheme.value = theme
}

const closeThemeDetails = () => {
  selectedTheme.value = null
}

// 核心下钻逻辑：点击项目，切换到 2D 森林视图 (ForestView) 并关掉弹窗
const diveIntoProject = (projectId) => {
  closeThemeDetails()
  // 首先选中该项目，这会改变 activeProjectId（在 store 中 selectProject 默认会切到 dashboard）
  store.selectProject(projectId)
  // 然后强制将视图切换回 forest
  store.openForest()
}
</script>

<style scoped>
.animate-bounce-slow {
  animation: bounce 3s infinite;
}
</style>