<template>
  <aside class="w-72 flex-shrink-0 bg-melvor-panel border-r border-melvor-border flex flex-col h-full select-none">
    <div class="h-16 flex items-center justify-center border-b border-melvor-border bg-[#2d2d2d] shadow-md shrink-0">
      <h1 class="text-xl font-bold tracking-widest text-green-500 uppercase flex items-center gap-2">
        <span>🌲</span> MINERVA
      </h1>
    </div>

    <div class="p-2 border-b border-melvor-border bg-[#252525] shrink-0 space-y-1">
       
       <button 
         @click="store.openShop()"
         :class="['w-full flex items-center gap-3 p-3 rounded-md transition-all font-bold uppercase tracking-wide text-sm',
         store.activeView === 'shop' ? 'bg-yellow-700 text-white shadow-lg ring-1 ring-yellow-500' : 'bg-[#333] text-yellow-500 hover:bg-[#3a3a3a]']">
         <span class="text-xl">🛒</span>
         <span>Shop</span>
       </button>

       <button 
         @click="store.openForest()"
         :class="['w-full flex items-center gap-3 p-3 rounded-md transition-all font-bold uppercase tracking-wide text-sm',
         store.activeView === 'forest' ? 'bg-green-800 text-white shadow-lg ring-1 ring-green-500' : 'bg-[#333] text-green-500 hover:bg-[#3a3a3a]']">
         <span class="text-xl">🧭</span>
         <span>Forest Ranger</span>
       </button>

       <button 
         @click="store.openNotebook()"
         :class="['w-full flex items-center gap-3 p-3 rounded-md transition-all font-bold uppercase tracking-wide text-sm',
         store.activeView === 'notebook' ? 'bg-blue-800 text-white shadow-lg ring-1 ring-blue-500' : 'bg-[#333] text-blue-500 hover:bg-[#3a3a3a]']">
         <span class="text-xl">📝</span>
         <span>Notebook</span>
       </button>
    </div>

    <div class="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
      Your Projects
    </div>
    
    <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
       <div v-if="store.projects.length === 0" class="p-4 text-center text-gray-500 text-sm mt-4">
        <p>暂无项目</p>
      </div>

      <button v-for="project in store.projects" :key="project.id" @click="store.selectProject(project.id)"
        :class="['w-full flex items-center p-3 rounded-md border-l-4 transition-all relative group', 
        store.activeProjectId === project.id && store.activeView === 'dashboard'
            ? 'bg-[#353535] border-green-500 text-white' 
            : 'border-transparent text-gray-400 hover:bg-[#2a2a2a]']">
        
        <div class="mr-3 text-2xl group-hover:scale-110 transition-transform">{{ project.icon }}</div>
        
        <div class="text-left flex-1 min-w-0">
          <div class="font-bold text-sm truncate">{{ project.name }}</div>
          <div class="text-[10px] text-gray-500 flex justify-between mt-1">
             <span>Lv. {{ project.level }}</span>
             <span class="text-gray-600">{{ project.totalTrees }} 🌲</span>
          </div>
          <div class="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
             <div class="bg-blue-500 h-full" :style="{ width: (project.currentXP / project.nextLevelXP) * 100 + '%' }"></div>
          </div>
        </div>
      </button>
    </div>

    <div class="p-4 border-t border-melvor-border bg-[#252525] shrink-0 flex flex-col gap-4">
      
      <div v-if="isCreating" class="flex flex-col gap-2">
         <input v-model="newProjectName" @keyup.enter="confirmCreate" ref="inputRef" type="text" placeholder="Project Name..." 
            class="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-green-500 outline-none" />
         <div class="flex gap-2">
            <button @click="confirmCreate" class="flex-1 bg-green-700 hover:bg-green-600 text-white text-xs py-1 rounded">OK</button>
            <button @click="isCreating = false" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 rounded">Cancel</button>
         </div>
      </div>
      <button v-else @click="startCreating" class="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded transition-colors text-sm font-bold">
        <span>+</span> New Project
      </button>

      <div class="pt-4 border-t border-gray-700 flex justify-between gap-2">
         <button @click="store.downloadSaveFile" class="flex-1 flex items-center justify-center gap-1 bg-[#333] hover:bg-[#444] text-xs text-gray-400 py-2 rounded border border-gray-600 transition-colors" title="Export Save">
            💾 Backup
         </button>
         
         <button @click="triggerImport" class="flex-1 flex items-center justify-center gap-1 bg-[#333] hover:bg-[#444] text-xs text-gray-400 py-2 rounded border border-gray-600 transition-colors" title="Import Save">
            📂 Import
         </button>
         <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileImport" />
      </div>

    </div>
  </aside>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useGameStore } from '@/stores/gameStore'
const store = useGameStore()
const isCreating = ref(false)
const newProjectName = ref('')
const inputRef = ref(null)
const fileInput = ref(null)

const startCreating = () => { isCreating.value = true; nextTick(() => inputRef.value?.focus()) }
const confirmCreate = () => { if (!newProjectName.value.trim()) return; store.createProject(newProjectName.value); newProjectName.value = ''; isCreating.value = false }
const triggerImport = () => { fileInput.value.click() }
const handleFileImport = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => { store.importSaveData(e.target.result); event.target.value = '' }
    reader.readAsText(file)
}
</script>