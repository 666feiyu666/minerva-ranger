<template>
  <aside 
    class="w-72 flex-shrink-0 border-r flex flex-col h-full select-none transition-all duration-500 backdrop-blur-md z-20"
    :class="store.isNightMode 
      ? 'bg-black/60 border-white/10' 
      : 'bg-white/80 border-gray-200/50 shadow-xl'"
  >
    <div class="h-16 flex items-center justify-center border-b shrink-0 transition-colors"
         :class="store.isNightMode ? 'border-white/10 bg-black/20' : 'border-gray-200/50 bg-white/40'">
      <h1 class="text-xl font-bold tracking-widest uppercase flex items-center gap-2"
          :class="store.isNightMode ? 'text-green-500' : 'text-emerald-700'">
        <span>🌲</span> 密涅瓦的巡林官
      </h1>
    </div>

    <div class="px-4 py-3 border-b shrink-0 transition-colors"
         :class="store.isNightMode ? 'border-white/10 bg-black/10' : 'border-gray-200/50 bg-white/20'">
      <div class="flex justify-between items-end text-xs mb-1">
        <span class="font-bold" :class="store.isNightMode ? 'text-purple-400' : 'text-purple-600'">Global Rank {{ store.globalLevel }}</span>
        <span :class="store.isNightMode ? 'text-gray-500' : 'text-gray-500'">{{ Math.floor(store.globalXP) }} XP</span>
      </div>
      <div class="w-full h-1.5 rounded-full overflow-hidden" 
           :class="store.isNightMode ? 'bg-gray-700' : 'bg-gray-300'" title="Global Level Progress">
        <div class="bg-gradient-to-r from-purple-600 to-blue-500 h-full transition-all duration-500" 
             :style="{ width: store.globalLevelProgress + '%' }"></div>
      </div>
    </div>

    <div class="p-2 border-b shrink-0 space-y-1 transition-colors"
         :class="store.isNightMode ? 'border-white/10 bg-black/20' : 'border-gray-200/50 bg-white/40'">
       <button @click="store.openShop()" :class="navBtnClass('shop', 'text-yellow-500', 'bg-yellow-700', 'text-yellow-700', 'bg-yellow-100')">
         <span class="text-xl">🏪</span><span>商店</span>
       </button>
       <button @click="store.openForest()" :class="navBtnClass('forest', 'text-green-500', 'bg-green-800', 'text-green-700', 'bg-green-100')">
         <span class="text-xl">🧭</span><span>巡林</span>
       </button>
       <button @click="store.openNotebook()" :class="navBtnClass('notebook', 'text-blue-500', 'bg-blue-800', 'text-blue-700', 'bg-blue-100')">
         <span class="text-xl">📝</span><span>记录</span>
       </button>
    </div>

    <div class="px-4 py-2 text-xs font-bold uppercase tracking-widest mt-2 flex justify-between items-center"
         :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
      <span>Your Projects</span>
      <span class="text-[10px]" :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400/80'">Drag to reorder</span>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2 custom-scrollbar overflow-x-visible">
       <div v-if="store.projects.length === 0" class="p-4 text-center text-sm mt-4"
            :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
        <p>暂无项目</p>
      </div>

      <div 
        v-for="(project, index) in store.projects" 
        :key="project.id"
        :draggable="editingId !== project.id" 
        @dragstart="handleDragStart(index, $event)"
        @dragover.prevent="handleDragOver($event)"
        @dragenter.prevent
        @drop.prevent="handleDrop(index)"
        @dragend="handleDragEnd"
        @click="store.selectProject(project.id)"
        class="pb-1 relative transition-all" 
        :class="{ 'z-50': activeMenuId === project.id }" 
      >
        <div 
            class="group w-full flex items-center p-2 rounded-md border-l-4 transition-all relative cursor-pointer backdrop-blur-sm pr-8"
            :class="[
              isActive(project.id) 
                ? (store.isNightMode ? 'bg-[#353535] border-green-500' : 'bg-emerald-50 border-emerald-500 shadow-sm') 
                : (store.isNightMode ? 'border-transparent hover:bg-[#2a2a2a]' : 'border-transparent hover:bg-white/60'),
              draggingIndex === index ? 'opacity-30 border-dashed border-gray-500' : ''
            ]"
        >
            <div class="absolute left-1 opacity-0 group-hover:opacity-100 cursor-move text-xs mr-1 pointer-events-none"
                 :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'">
                ⋮⋮
            </div>
            
            <div class="mr-3 ml-3 text-2xl transition-transform group-hover:scale-105 select-none pointer-events-none">{{ project.icon }}</div>
            
            <div class="text-left flex-1 min-w-0">
                <div v-if="editingId === project.id" class="mr-2" @click.stop>
                    <input 
                        ref="renameInput"
                        v-model="editName"
                        @blur="confirmRename"
                        @keyup.enter="confirmRename"
                        @keyup.esc="cancelRename"
                        type="text"
                        class="w-full text-sm px-1 py-0.5 rounded outline-none border border-blue-500 bg-transparent"
                        :class="store.isNightMode ? 'text-white' : 'text-gray-900'"
                    />
                </div>

                <div v-else class="pointer-events-none">
                    <div class="font-bold text-sm truncate" 
                         :class="isActive(project.id) 
                            ? (store.isNightMode ? 'text-white' : 'text-emerald-900') 
                            : (store.isNightMode ? 'text-gray-400' : 'text-gray-600')">
                        {{ project.name }}
                    </div>
                    <div class="text-[10px] flex justify-between mt-1"
                         :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
                        <span>Lv. {{ project.level }}</span>
                        <span>{{ project.totalTrees }} 🌲</span>
                    </div>
                    <div class="w-full h-1 mt-1 rounded-full overflow-hidden"
                         :class="store.isNightMode ? 'bg-gray-700' : 'bg-gray-200'">
                        <div class="bg-blue-500 h-full transition-all" :style="{ width: (project.currentXP / project.nextLevelXP) * 100 + '%' }"></div>
                    </div>
                </div>
            </div>

            <button 
                @click.stop="toggleMenu(project.id)"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                :class="[
                   activeMenuId === project.id ? 'opacity-100 bg-black/10 dark:bg-white/10' : '',
                   store.isNightMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-800 hover:bg-black/5'
                ]"
                title="More Options"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>

            <div v-if="activeMenuId === project.id" 
                 class="absolute right-0 top-full mt-1 w-32 rounded-lg shadow-xl border z-50 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col py-1"
                 :class="store.isNightMode ? 'bg-[#252525] border-gray-700' : 'bg-white border-gray-200'"
                 @click.stop
            >
                <button @click="startRename(project)" 
                        class="text-left px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t"
                        :class="[
                           store.isNightMode ? 'border-gray-700 text-blue-400' : 'border-gray-100 text-blue-600'
                        ]">
                   <span>✏️</span> 重命名
                </button>
                <button @click="handleDelete(project)" 
                        class="text-left px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t"
                        :class="[
                          store.isNightMode ? 'text-red-400 border-gray-700' : 'text-red-600 border-gray-100'
                        ]">
                   <span>🗑️</span> 删除
                </button>
            </div>

        </div>
      </div>
    </div>

    <div class="p-4 border-t shrink-0 flex flex-col gap-4 transition-colors"
         :class="store.isNightMode ? 'border-white/10 bg-black/20' : 'border-gray-200/50 bg-white/40'">
      
      <div v-if="isCreating" class="flex flex-col gap-2">
         <input v-model="newProjectName" @keyup.enter="confirmCreate" ref="inputRef" type="text" placeholder="Project Name..." 
            class="w-full text-sm px-3 py-2 rounded border focus:border-green-500 outline-none transition-colors" 
            :class="store.isNightMode 
              ? 'bg-gray-800 text-white border-gray-600' 
              : 'bg-white text-gray-900 border-gray-300 shadow-inner'"/>
         <div class="flex gap-2">
            <button @click="confirmCreate" class="flex-1 bg-green-700 hover:bg-green-600 text-white text-xs py-1 rounded">OK</button>
            <button @click="isCreating = false" 
                    class="flex-1 text-white text-xs py-1 rounded transition-colors"
                    :class="store.isNightMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-500'">Cancel</button>
         </div>
      </div>
      
      <button v-else @click="startCreating" 
              class="w-full flex items-center justify-center gap-2 py-2 rounded transition-colors text-sm font-bold border border-dashed"
              :class="store.isNightMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-transparent' 
                : 'bg-white/50 hover:bg-white text-gray-500 hover:text-emerald-600 border-gray-300 hover:border-emerald-400'">
        <span>+</span> New Project
      </button>

      <div class="pt-4 border-t flex justify-between gap-2"
           :class="store.isNightMode ? 'border-gray-700' : 'border-gray-200/50'">
         <button @click="store.downloadSaveFile" 
                 class="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded border transition-colors"
                 :class="store.isNightMode 
                   ? 'bg-[#333] hover:bg-[#444] text-gray-400 border-gray-600' 
                   : 'bg-white/60 hover:bg-white text-gray-500 border-gray-300 shadow-sm'" 
                 title="Export Save">
            💾 Backup
         </button>
         
         <button @click="triggerImport" 
                 class="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded border transition-colors"
                 :class="store.isNightMode 
                   ? 'bg-[#333] hover:bg-[#444] text-gray-400 border-gray-600' 
                   : 'bg-white/60 hover:bg-white text-gray-500 border-gray-300 shadow-sm'"
                 title="Import Save">
            📂 Import
         </button>
         <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileImport" />
      </div>
    </div>
    
    <div class="pt-2 mt-2 border-t border-dashed"
        :class="store.isNightMode ? 'border-gray-700' : 'border-gray-300'">
        
        <div v-if="!store.user">
            <div v-if="!showLoginForm" class="flex flex-col gap-2">
              <button @click="showLoginForm = true"
                      class="w-full flex items-center justify-center gap-2 py-2 rounded transition-colors text-xs font-bold"
                      :class="store.isNightMode ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'">
                <span>📧</span> Email Login / Sign Up
              </button>
            </div>

            <div v-else class="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div class="text-[10px] text-center opacity-60" :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
                Enter email & password to start
              </div>

              <input v-model="email" type="email" placeholder="Email (e.g. user@test.com)"
                      class="w-full px-2 py-2 text-xs rounded border outline-none transition-colors"
                      :class="store.isNightMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black placeholder-gray-400'"/>
              
              <input v-model="password" type="password" placeholder="Password (min 6 chars)"
                      class="w-full px-2 py-2 text-xs rounded border outline-none transition-colors"
                      :class="store.isNightMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black placeholder-gray-400'"/>

              <div class="flex gap-2 mt-1">
                  <button @click="handleEmailLogin"
                          class="flex-1 py-1.5 rounded text-xs font-bold text-white bg-green-600 hover:bg-green-500 shadow-sm">
                    Login
                  </button>
                  <button @click="handleEmailRegister"
                          class="flex-1 py-1.5 rounded text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm">
                    Sign Up
                  </button>
              </div>
              
              <button @click="showLoginForm = false" 
                      class="text-[10px] underline text-center w-full mt-1 hover:opacity-80"
                      :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
                  Cancel
              </button>
            </div>
        </div>

        <div v-else class="flex flex-col gap-2">
          <div class="flex items-center justify-between px-1">
              <div class="text-[10px] truncate max-w-[120px] opacity-70" :title="store.user.email"
                  :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
                {{ store.user.email }}
              </div>
              <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          
          <div class="flex gap-2">
            <button @click="store.uploadSaveToCloud" 
                    class="flex-1 text-[10px] py-1.5 rounded border font-bold transition-colors"
                    :class="store.isNightMode 
                      ? 'bg-green-900/30 border-green-800 text-green-400 hover:bg-green-800' 
                      : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'">
                ⬆️ Upload
            </button>
            <button @click="store.downloadSaveFromCloud" 
                    class="flex-1 text-[10px] py-1.5 rounded border font-bold transition-colors"
                    :class="store.isNightMode 
                      ? 'bg-blue-900/30 border-blue-800 text-blue-400 hover:bg-blue-800' 
                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'">
                ⬇️ Load
            </button>
          </div>

          <button @click="store.logout" 
                  class="w-full text-[10px] py-1 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'">
              Sign Out
          </button>
        </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
const store = useGameStore()
const isCreating = ref(false)
const newProjectName = ref('')
const inputRef = ref(null)
const fileInput = ref(null)

const showLoginForm = ref(false)
const email = ref('')
const password = ref('')

// === 菜单与重命名逻辑 ===
const activeMenuId = ref(null)
const editingId = ref(null)
const editName = ref('')
const renameInput = ref(null)

const closeMenu = () => { activeMenuId.value = null }
onMounted(() => document.addEventListener('click', closeMenu))
onUnmounted(() => document.removeEventListener('click', closeMenu))

const toggleMenu = (id) => {
    activeMenuId.value = activeMenuId.value === id ? null : id
}

const handleReset = (project) => {
    if (confirm(`确定要清空 "${project.name}" 的所有种树进度吗？\n（此操作无法撤销）`)) {
        store.resetProjectProgress(project.id)
        activeMenuId.value = null
    }
}

const startRename = (project) => {
    editingId.value = project.id
    editName.value = project.name
    activeMenuId.value = null 
    nextTick(() => {
        if (renameInput.value && renameInput.value.length > 0) {
           const input = renameInput.value.find(el => el && el.offsetParent !== null)
           if (input) input.focus()
        }
    })
}

const confirmRename = () => {
    if (editingId.value && editName.value.trim()) {
        store.renameProject(editingId.value, editName.value)
    }
    cancelRename()
}

const cancelRename = () => {
    editingId.value = null
    editName.value = ''
}

const handleDelete = (project) => {
    if (confirm(`确定要删除项目 "${project.name}" 吗？\n删除后无法恢复！`)) {
        store.deleteProject(project.id)
    }
    activeMenuId.value = null
}

const handleEmailLogin = async () => {
    const success = await store.loginWithEmail(email.value, password.value)
    if (success) showLoginForm.value = false
}

const handleEmailRegister = async () => {
    const success = await store.registerWithEmail(email.value, password.value)
    if (success) showLoginForm.value = false
}

// === 拖拽逻辑 ===
const draggingIndex = ref(null)

const handleDragStart = (index, event) => {
    if (editingId.value !== null) {
        event.preventDefault()
        return
    }
    draggingIndex.value = index
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.dropEffect = 'move'
    event.dataTransfer.setData('text/plain', index)
}

const handleDragOver = (event) => {
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

// === 样式辅助 ===
const navBtnClass = (view, nightText, nightBg, dayText, dayBg) => {
    const isActive = store.activeView === view
    const isNight = store.isNightMode
    const base = 'w-full flex items-center gap-3 p-3 rounded-md transition-all font-bold uppercase tracking-wide text-sm'
    
    if (isActive) {
        return [base, isNight ? `${nightBg} text-white` : `${dayBg} ${dayText} shadow-md ring-1 ring-black/5`]
    } else {
        return [base, isNight 
          ? `bg-[#333] ${nightText} hover:bg-[#3a3a3a]` 
          : `bg-white/50 text-gray-500 hover:bg-white/80`]
    }
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