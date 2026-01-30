<template>
  <div class="flex-1 p-6 flex flex-col h-full bg-[#121212] overflow-hidden">
    
    <div class="flex justify-between items-center mb-6 shrink-0 bg-melvor-panel p-6 rounded-lg border border-melvor-border shadow-lg">
       <div>
          <h2 class="text-3xl font-bold text-green-500 flex items-center gap-3">
            <span>🧭</span> Forest Ranger Tour
          </h2>
          <p class="text-gray-400 text-sm mt-1">Review your growth across different projects.</p>
       </div>
       <div class="flex flex-col items-end">
          <div class="text-2xl font-bold text-white">{{ totalTreesGlobal }} <span class="text-green-500">Trees Planted</span></div>
          <div class="text-xs text-gray-500">Global Ecosystem</div>
       </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
       
       <div v-if="store.projects.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-600">
           <div class="text-4xl mb-2">🏜️</div>
           <p>No forests found. Start a project to plant trees!</p>
       </div>

       <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          <div v-for="project in store.projects" :key="project.id" 
               class="bg-melvor-panel border border-melvor-border rounded-lg overflow-hidden flex flex-col hover:border-green-800 transition-colors shadow-lg">
             
             <div class="p-4 bg-[#202020] border-b border-melvor-border flex justify-between items-center">
                <div class="flex items-center gap-3">
                   <div class="text-2xl">{{ project.icon }}</div>
                   <div>
                      <h3 class="font-bold text-gray-200">{{ project.name }}</h3>
                      <div class="text-xs text-blue-400 font-bold">Level {{ project.level }}</div>
                   </div>
                </div>
                <div class="text-right">
                   <div class="text-xl font-mono text-green-500 font-bold">{{ project.totalTrees }} 🌲</div>
                </div>
             </div>

             <div class="p-4 flex-1 bg-[#151515] min-h-[150px]">
                <div v-if="!project.forest || Object.keys(project.forest).length === 0" class="h-full flex items-center justify-center text-gray-700 text-sm italic">
                   Soil is empty...
                </div>
                
                <div v-else class="flex flex-wrap gap-2 content-start">
                   <div v-for="(count, treeId) in project.forest" :key="treeId" 
                        class="flex items-center gap-1 bg-[#252525] border border-[#333] px-2 py-1 rounded-full text-xs text-gray-300"
                        title="Trees planted">
                        <span class="text-lg">{{ store.getTreeIcon(treeId) }}</span>
                        <span class="font-bold">x{{ count }}</span>
                   </div>
                </div>
             </div>

             <div class="p-2 bg-[#1a1a1a] border-t border-melvor-border text-[10px] text-gray-600 text-center uppercase tracking-widest">
                {{ Object.keys(project.forest || {}).length }} Species Discovered
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

const totalTreesGlobal = computed(() => {
    return store.projects.reduce((sum, p) => sum + p.totalTrees, 0)
})
</script>