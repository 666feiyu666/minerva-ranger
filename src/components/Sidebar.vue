<template>
  <aside class="w-72 flex-shrink-0 bg-melvor-panel border-r border-melvor-border flex flex-col h-full select-none">
    <div class="h-16 flex items-center justify-center border-b border-melvor-border bg-[#2d2d2d] shadow-md shrink-0">
      <h1 class="text-xl font-bold tracking-widest text-green-500 uppercase flex items-center gap-2">
        <span>🌲</span> 密涅瓦的巡林官
      </h1>
    </div>

    <div class="px-4 py-3 border-b border-melvor-border bg-[#222] shrink-0">
      <div class="flex justify-between items-end text-xs mb-1">
        <span class="text-purple-400 font-bold">Global Rank {{ store.globalLevel }}</span>
        <span class="text-gray-500">{{ Math.floor(store.globalXP) }} XP</span>
      </div>
      <div class="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden" title="Global Level Progress">
        <div class="bg-gradient-to-r from-purple-600 to-blue-500 h-full transition-all duration-500" 
             :style="{ width: store.globalLevelProgress + '%' }"></div>
      </div>
    </div>

    <div class="p-2 border-b border-melvor-border bg-[#252525] shrink-0 space-y-1">
       <button @click="store.openShop()" :class="navBtnClass('shop', 'text-yellow-500', 'bg-yellow-700')">
         <span class="text-xl">🛒</span><span>商店</span>
       </button>
       <button @click="store.openForest()" :class="navBtnClass('forest', 'text-green-500', 'bg-green-800')">
         <span class="text-xl">🧭</span><span>巡林</span>
       </button>
       <button @click="store.openNotebook()" :class="navBtnClass('notebook', 'text-blue-500', 'bg-blue-800')">
         <span class="text-xl">📝</span><span>记录</span>
       </button>
    </div>

    <div class="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest mt-2 flex justify-between items-center">
      <span>Your Projects</span>
      <span class="text-[10px] text-gray-600">Drag to reorder</span>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2 custom-scrollbar">
       <div v-if="store.projects.length === 0" class="p-4 text-center text-gray-500 text-sm mt-4">
        <p>暂无项目</p>
      </div>

      <div 
        v-for="(project, index) in store.projects" 
        :key="project.id"
        draggable="true"
        @dragstart="handleDragStart(index, $event)"
        @dragover.prevent="handleDragOver($event)"
        @dragenter.prevent
        @drop.prevent="handleDrop(index)"
        @dragend="handleDragEnd"
        @click="store.selectProject(project.id)"
        class="pb-1" 
      >
        <div 
            class="group w-full flex items-center p-2 rounded-md border-l-4 transition-all relative hover:bg-[#2a2a2a] cursor-pointer"
            :class="[
            isActive(project.id) ? 'bg-[#353535] border-green-500' : 'border-transparent',
            draggingIndex === index ? 'opacity-30 border-dashed border-gray-500' : ''
            ]"
        >
            <div class="absolute left-1 text-gray-600 opacity-0 group-hover:opacity-100 cursor-move text-xs mr-1 pointer-events-none">
                ⋮⋮
            </div>
            
            <div class="mr-3 ml-3 text-2xl transition-transform group-hover:scale-105 select-none pointer-events-none">{{ project.icon }}</div>
            
            <div class="text-left flex-1 min-w-0 pointer-events-none">
            <div class="font-bold text-sm truncate" :class="isActive(project.id) ? 'text-white' : 'text-gray-400'">
                {{ project.name }}
            </div>
            <div class="text-[10px] text-gray-500 flex justify-between mt-1">
                <span>Lv. {{ project.level }}</span>
                <span class="text-gray-600">{{ project.totalTrees }} 🌲</span>
            </div>
            <div class="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-full transition-all" :style="{ width: (project.currentXP / project.nextLevelXP) * 100 + '%' }"></div>
            </div>
            </div>
        </div>
      </div>
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

const draggingIndex = ref(null)

const handleDragStart = (index, event) => {
    draggingIndex.value = index
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.dropEffect = 'move'
    event.dataTransfer.setData('text/plain', index)
}

const handleDragOver = (event) => {
    // 必须设置这个，否则 drop 可能不会触发
    event.dataTransfer.dropEffect = 'move'
}

const handleDrop = (toIndex) => {
    const fromIndex = draggingIndex.value
    if (fromIndex !== null && fromIndex !== undefined && fromIndex !== toIndex) {
        store.reorderProjects(fromIndex, toIndex)
    }
    draggingIndex.value = null
}

const handleDragEnd = () => {
    draggingIndex.value = null
}

const navBtnClass = (view, textClass, activeBgClass) => {
    const isActive = store.activeView === view
    return [
        'w-full flex items-center gap-3 p-3 rounded-md transition-all font-bold uppercase tracking-wide text-sm',
        isActive ? `${activeBgClass} text-white shadow-lg ring-1` : `bg-[#333] ${textClass} hover:bg-[#3a3a3a]`
    ]
}

const isActive = (id) => store.activeProjectId === id && store.activeView === 'dashboard'
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