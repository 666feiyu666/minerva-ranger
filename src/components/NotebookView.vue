<template>
  <div class="flex-1 p-6 flex flex-col h-full bg-[#121212] overflow-hidden">
    
    <div class="flex justify-between items-center mb-6 shrink-0 bg-melvor-panel p-6 rounded-lg border border-melvor-border shadow-lg">
       <div>
          <h2 class="text-3xl font-bold text-blue-400 flex items-center gap-3">
            <span>📝</span> 
            <span>Research Notebook</span>
          </h2>
          <p class="text-gray-400 text-sm mt-1">
             Manage your knowledge assets. Tag notes with multiple projects.
          </p>
       </div>
       <div class="flex flex-col items-end">
          <div class="flex items-center gap-2 bg-black/40 px-5 py-2 rounded-full border border-yellow-900/50 mb-2">
             <span class="text-2xl">🪙</span>
             <span class="text-2xl font-bold text-yellow-400 font-mono">{{ store.coins }}</span>
          </div>
          <div class="text-xs text-gray-500">Rate: 10 Words = 1 Coin</div>
       </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">
       
       <div class="bg-melvor-panel border border-melvor-border rounded-lg p-6">
          <h3 class="text-lg font-bold text-gray-200 mb-4">Submit New Note</h3>
          
          <div class="flex flex-col gap-4">
             <div>
                <label class="block text-xs text-gray-500 uppercase tracking-widest mb-2">Tag Projects (Optional)</label>
                <div v-if="store.projects.length === 0" class="text-sm text-gray-600 italic">
                   No projects created yet. Note will be saved to Global only.
                </div>
                <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-2 bg-[#1a1a1a] p-3 rounded border border-gray-700 max-h-32 overflow-y-auto custom-scrollbar">
                   <label v-for="p in store.projects" :key="p.id" 
                          class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white select-none">
                      <input type="checkbox" :value="p.id" v-model="selectedProjectIds" 
                             class="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-offset-[#1a1a1a]">
                      <span class="truncate" :title="p.name">{{ p.name }}</span>
                   </label>
                </div>
             </div>

             <div>
                <label class="block text-xs text-gray-500 uppercase tracking-widest mb-1">Note Title</label>
                <input v-model="noteTitle" type="text" placeholder="e.g., Chapter 1 Summary..." 
                   class="w-full bg-[#1a1a1a] border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors">
             </div>

             <div class="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:bg-[#1a1a1a] transition-colors cursor-pointer relative"
                  @click="triggerFileSelect">
                <input ref="fileInput" type="file" accept=".md,.txt" class="hidden" @change="handleFileChange">
                <div class="text-4xl mb-2">📄</div>
                <p class="text-gray-400 font-bold">Click to upload .md file</p>
                <p class="text-xs text-gray-600 mt-1">
                   Tags: 
                   <span v-if="selectedProjectIds.length === 0" class="text-gray-500">Global Only</span>
                   <span v-else class="text-blue-400 font-bold">{{ selectedProjectIds.length }} Projects Selected</span>
                </p>
             </div>
          </div>
       </div>

       <div class="bg-melvor-panel border border-melvor-border rounded-lg p-6 flex-1 flex flex-col">
          
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 class="text-lg font-bold text-gray-200">Submission History</h3>
              <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 uppercase">Filter:</span>
                  <select v-model="filterId" 
                      class="bg-[#1a1a1a] border border-gray-700 rounded px-3 py-1 text-sm text-gray-300 focus:border-blue-500 outline-none">
                      <option value="ALL">Show All</option>
                      <option v-for="p in store.projects" :key="p.id" :value="p.id">
                         📁 {{ p.name }}
                      </option>
                  </select>
              </div>
          </div>
          
          <div v-if="filteredNotes.length === 0" class="text-gray-600 text-center py-10 italic">
             No notes found matching the current filter.
          </div>

          <div class="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
             <div v-for="note in filteredNotes" :key="note.id" 
                  class="bg-[#1a1a1a] border border-[#333] p-3 rounded hover:border-gray-600 transition-colors">
                
                <div class="flex items-start justify-between">
                    <div class="flex items-start gap-3 flex-1">
                        <div class="bg-blue-900/20 p-2 rounded text-blue-400 mt-1">📝</div>
                        <div class="flex-1">
                            <div class="font-bold text-gray-200 flex items-center gap-2">
                                {{ note.title }}
                                <button v-if="editingNoteId !== note.id" @click="startEdit(note)" 
                                        class="text-gray-600 hover:text-blue-400 text-xs transition-colors" title="Edit Tags">
                                    ✏️
                                </button>
                            </div>
                            
                            <div v-if="editingNoteId !== note.id" class="flex flex-wrap items-center gap-2 mt-1">
                                <span class="text-xs text-gray-500">{{ note.date }}</span>
                                <template v-if="note.projectIds && note.projectIds.length > 0">
                                    <span v-for="pid in note.projectIds" :key="pid" 
                                            class="text-[10px] text-green-400 bg-green-900/20 px-1.5 rounded border border-green-900/30">
                                        {{ getProjectName(pid) }}
                                    </span>
                                </template>
                                <span v-else class="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">
                                    Global
                                </span>
                            </div>

                            <div v-else class="mt-2 bg-[#121212] p-3 rounded border border-blue-900/50 animate-in fade-in zoom-in duration-200">
                                <div class="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">Reclassify Note</div>
                                <div class="grid grid-cols-2 gap-2 mb-3 max-h-32 overflow-y-auto custom-scrollbar">
                                    <label v-for="p in store.projects" :key="p.id" 
                                            class="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                                        <input type="checkbox" :value="p.id" v-model="editSelectedIds" 
                                                class="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-offset-[#1a1a1a]">
                                        <span class="truncate">{{ p.name }}</span>
                                    </label>
                                </div>
                                <div class="flex gap-2">
                                    <button @click="saveEdit" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-bold transition-colors">
                                        Save
                                    </button>
                                    <button @click="cancelEdit" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="text-right pl-4">
                        <div class="text-yellow-500 font-bold font-mono">+{{ note.coins }} 🪙</div>
                        <div class="text-xs text-gray-600">{{ note.wordCount }} words</div>
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

// ... (以下逻辑保持不变：初始化勾选、FilteredNotes 计算、文件上传等) ...

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