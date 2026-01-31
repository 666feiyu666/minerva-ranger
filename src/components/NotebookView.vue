<template>
  <div class="flex-1 p-6 flex flex-col h-full bg-transparent overflow-hidden">
    
    <div class="flex justify-between items-center mb-6 shrink-0 p-6 rounded-lg border shadow-lg backdrop-blur-sm transition-all"
         :class="store.isNightMode 
           ? 'bg-[#1a1a1a]/80 border-gray-700' 
           : 'bg-white/70 border-white/60 shadow-lg ring-1 ring-black/5'">
       <div>
          <h2 class="text-3xl font-bold flex items-center gap-3 transition-colors"
              :class="store.isNightMode ? 'text-blue-400' : 'text-blue-600'">
            <span>📝</span> 
            <span>记录</span>
          </h2>
          <p class="text-sm mt-1 transition-colors"
             :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
             记录你在密涅瓦的巡林日常。
          </p>
       </div>
       <div class="flex flex-col items-end">
          <div class="flex items-center gap-2 px-5 py-2 rounded-full border mb-2 backdrop-blur-sm transition-colors"
               :class="store.isNightMode 
                 ? 'bg-black/40 border-yellow-900/50' 
                 : 'bg-yellow-50 border-yellow-200 shadow-sm'">
             <span class="text-2xl">🪙</span>
             <span class="text-2xl font-bold font-mono transition-colors"
                   :class="store.isNightMode ? 'text-yellow-400' : 'text-yellow-600'">{{ store.coins }}</span>
          </div>
          <div class="text-xs transition-colors"
               :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">Rate: 10 Words = 1 Coin</div>
       </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">
       
       <div class="border rounded-lg p-6 transition-all backdrop-blur-sm shadow-md"
            :class="store.isNightMode ? 'bg-[#1a1a1a]/60 border-gray-700' : 'bg-white/50 border-white/60'">
          <h3 class="text-lg font-bold mb-4 transition-colors"
              :class="store.isNightMode ? 'text-gray-200' : 'text-gray-800'">Submit New Note</h3>
          
          <div class="flex flex-col gap-4">
             <div>
                <label class="block text-xs uppercase tracking-widest mb-2"
                       :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">Tag Projects (Optional)</label>
                <div v-if="store.projects.length === 0" class="text-sm italic"
                     :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'">
                   No projects created yet. Note will be saved to Global only.
                </div>
                <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded border max-h-32 overflow-y-auto custom-scrollbar transition-colors"
                     :class="store.isNightMode 
                       ? 'bg-[#1a1a1a] border-gray-700' 
                       : 'bg-white/80 border-gray-200 shadow-inner'">
                   <label v-for="p in store.projects" :key="p.id" 
                          class="flex items-center gap-2 text-sm cursor-pointer select-none transition-colors"
                          :class="store.isNightMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'">
                      <input type="checkbox" :value="p.id" v-model="selectedProjectIds" 
                             class="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-offset-[#1a1a1a]">
                      <span class="truncate" :title="p.name">{{ p.name }}</span>
                   </label>
                </div>
             </div>

             <div>
                <label class="block text-xs uppercase tracking-widest mb-1"
                       :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">Note Title</label>
                <input v-model="noteTitle" type="text" placeholder="e.g., Chapter 1 Summary..." 
                   class="w-full rounded p-3 outline-none transition-colors border"
                   :class="store.isNightMode 
                     ? 'bg-[#1a1a1a] border-gray-700 text-white focus:border-blue-500 placeholder-gray-600' 
                     : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 placeholder-gray-400 shadow-sm'">
             </div>

             <div class="border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer relative group"
                  :class="store.isNightMode 
                    ? 'border-gray-700 hover:bg-[#1a1a1a] hover:border-gray-500' 
                    : 'border-gray-300 hover:bg-white/80 hover:border-blue-400 bg-white/30'"
                  @click="triggerFileSelect">
                <input ref="fileInput" type="file" accept=".md,.txt" class="hidden" @change="handleFileChange">
                <div class="text-4xl mb-2 transition-transform group-hover:scale-110">📄</div>
                <p class="font-bold transition-colors"
                   :class="store.isNightMode ? 'text-gray-400' : 'text-gray-600'">Click to upload .md file</p>
                <p class="text-xs mt-1 transition-colors"
                   :class="store.isNightMode ? 'text-gray-600' : 'text-gray-500'">
                   Tags: 
                   <span v-if="selectedProjectIds.length === 0" class="opacity-70">Global Only</span>
                   <span v-else class="text-blue-500 font-bold">{{ selectedProjectIds.length }} Projects Selected</span>
                </p>
             </div>
          </div>
       </div>

       <div class="border rounded-lg p-6 flex-1 flex flex-col backdrop-blur-sm shadow-md transition-all"
            :class="store.isNightMode ? 'bg-[#1a1a1a]/60 border-gray-700' : 'bg-white/50 border-white/60'">
          
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 class="text-lg font-bold transition-colors"
                  :class="store.isNightMode ? 'text-gray-200' : 'text-gray-800'">Submission History</h3>
              <div class="flex items-center gap-2">
                  <span class="text-xs uppercase" :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">Filter:</span>
                  <select v-model="filterId" 
                      class="border rounded px-3 py-1 text-sm outline-none transition-colors"
                      :class="store.isNightMode 
                        ? 'bg-[#1a1a1a] border-gray-700 text-gray-300' 
                        : 'bg-white border-gray-300 text-gray-700 shadow-sm'">
                      <option value="ALL">Show All</option>
                      <option v-for="p in store.projects" :key="p.id" :value="p.id">
                          📁 {{ p.name }}
                      </option>
                  </select>
              </div>
          </div>
          
          <div v-if="filteredNotes.length === 0" class="text-center py-10 italic transition-colors"
               :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'">
              No notes found matching the current filter.
          </div>

          <div class="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
             <div v-for="note in filteredNotes" :key="note.id" 
                  class="border p-3 rounded transition-all backdrop-blur-sm hover:shadow-md"
                  :class="store.isNightMode 
                    ? 'bg-[#1a1a1a]/80 border-[#333] hover:border-gray-600' 
                    : 'bg-white/60 border-gray-200 hover:bg-white hover:border-blue-200'">
                
                <div class="flex items-start justify-between">
                    <div class="flex items-start gap-3 flex-1">
                        <div class="p-2 rounded mt-1 transition-colors"
                             :class="store.isNightMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'">📝</div>
                        <div class="flex-1">
                            <div class="font-bold flex items-center gap-2 transition-colors"
                                 :class="store.isNightMode ? 'text-gray-200' : 'text-gray-800'">
                                {{ note.title }}
                                <button v-if="editingNoteId !== note.id" @click="startEdit(note)" 
                                        class="text-xs transition-colors" 
                                        :class="store.isNightMode ? 'text-gray-600 hover:text-blue-400' : 'text-gray-400 hover:text-blue-600'"
                                        title="Edit Tags">
                                    ✏️
                                </button>
                            </div>
                            
                            <div v-if="editingNoteId !== note.id" class="flex flex-wrap items-center gap-2 mt-1">
                                <span class="text-xs" :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">{{ note.date }}</span>
                                <template v-if="note.projectIds && note.projectIds.length > 0">
                                    <span v-for="pid in note.projectIds" :key="pid" 
                                          class="text-[10px] px-1.5 rounded border transition-colors"
                                          :class="store.isNightMode 
                                            ? 'text-green-400 bg-green-900/20 border-green-900/30' 
                                            : 'text-emerald-700 bg-emerald-50 border-emerald-200'">
                                        {{ getProjectName(pid) }}
                                    </span>
                                </template>
                                <span v-else class="text-[10px] px-1.5 rounded"
                                      :class="store.isNightMode ? 'text-gray-500 bg-gray-800' : 'text-gray-500 bg-gray-200'">
                                    Global
                                </span>
                            </div>

                            <div v-else class="mt-2 p-3 rounded border animate-in fade-in zoom-in duration-200"
                                 :class="store.isNightMode 
                                   ? 'bg-[#121212] border-blue-900/50' 
                                   : 'bg-white border-blue-200 shadow-lg'">
                                <div class="text-xs mb-2 font-bold uppercase tracking-wider"
                                     :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">Reclassify Note</div>
                                <div class="grid grid-cols-2 gap-2 mb-3 max-h-32 overflow-y-auto custom-scrollbar">
                                    <label v-for="p in store.projects" :key="p.id" 
                                           class="flex items-center gap-2 text-xs cursor-pointer select-none"
                                           :class="store.isNightMode ? 'text-gray-300' : 'text-gray-700'">
                                        <input type="checkbox" :value="p.id" v-model="editSelectedIds" 
                                               class="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-offset-[#1a1a1a]">
                                        <span class="truncate">{{ p.name }}</span>
                                    </label>
                                </div>
                                <div class="flex gap-2">
                                    <button @click="saveEdit" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-bold transition-colors shadow-sm">
                                        Save
                                    </button>
                                    <button @click="cancelEdit" 
                                            class="px-3 py-1 text-xs rounded transition-colors"
                                            :class="store.isNightMode 
                                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="text-right pl-4">
                        <div class="font-bold font-mono transition-colors"
                             :class="store.isNightMode ? 'text-yellow-500' : 'text-yellow-600'">+{{ note.coins }} 🪙</div>
                        <div class="text-xs" :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'">{{ note.wordCount }} words</div>
                    </div>
                </div>
             </div>
          </div>

       </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
const store = useGameStore()

const noteTitle = ref('')
const fileInput = ref(null)
const selectedProjectIds = ref([]) // 上传用的
const filterId = ref('ALL')

// === 编辑状态管理 ===
const editingNoteId = ref(null)    // 当前正在编辑哪条笔记
const editSelectedIds = ref([])    // 编辑状态下的临时勾选列表

// 开始编辑
const startEdit = (note) => {
    editingNoteId.value = note.id
    // 复制当前的标签到临时数组，防止直接修改 Store
    editSelectedIds.value = note.projectIds ? [...note.projectIds] : []
}

// 取消编辑
const cancelEdit = () => {
    editingNoteId.value = null
    editSelectedIds.value = []
}

// 保存编辑
const saveEdit = () => {
    if (editingNoteId.value) {
        store.updateNoteTags(editingNoteId.value, editSelectedIds.value)
        cancelEdit()
    }
}

if (store.activeProjectId) {
    selectedProjectIds.value = [store.activeProjectId]
}

watch(() => store.activeProjectId, (newVal) => {
    if (newVal) {
        if (!selectedProjectIds.value.includes(newVal)) {
             selectedProjectIds.value = [newVal]
        }
    }
})

const filteredNotes = computed(() => {
    if (filterId.value === 'ALL') {
        return store.notebook
    }
    return store.notebook.filter(n => n.projectIds && n.projectIds.includes(filterId.value))
})

const getProjectName = (pid) => {
    const p = store.projects.find(proj => proj.id === pid)
    return p ? p.name : 'Unknown'
}

const triggerFileSelect = () => {
    fileInput.value.click()
}

const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!noteTitle.value) {
        noteTitle.value = file.name.replace('.md', '').replace('.txt', '')
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        const content = e.target.result
        store.uploadNote(noteTitle.value, content, [...selectedProjectIds.value])
        noteTitle.value = ''
        event.target.value = '' 
        alert(`Note uploaded successfully!`)
    }
    reader.readAsText(file)
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.4); 
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.6); 
}
</style>