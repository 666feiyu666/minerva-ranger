<template>
  <div class="flex-1 p-6 flex flex-col h-full bg-[#121212] overflow-hidden">
    
    <div class="flex justify-between items-center mb-6 shrink-0 bg-melvor-panel p-6 rounded-lg border border-melvor-border shadow-lg">
       <div>
          <h2 class="text-3xl font-bold text-blue-400 flex items-center gap-3">
            <span>📝</span> Research Notebook
          </h2>
          <p class="text-gray-400 text-sm mt-1">Convert your knowledge into Gold. Upload your Markdown notes.</p>
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
                <label class="block text-xs text-gray-500 uppercase tracking-widest mb-1">Note Title</label>
                <input v-model="noteTitle" type="text" placeholder="e.g., Narrative Theory Summary..." 
                   class="w-full bg-[#1a1a1a] border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors">
             </div>

             <div class="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:bg-[#1a1a1a] transition-colors cursor-pointer relative"
                  @click="triggerFileSelect">
                <input ref="fileInput" type="file" accept=".md,.txt" class="hidden" @change="handleFileChange">
                <div class="text-4xl mb-2">📄</div>
                <p class="text-gray-400 font-bold">Click to upload .md file</p>
                <p class="text-xs text-gray-600 mt-1">Only text content is analyzed for word count.</p>
             </div>
          </div>
       </div>

       <div class="bg-melvor-panel border border-melvor-border rounded-lg p-6 flex-1">
          <h3 class="text-lg font-bold text-gray-200 mb-4">Submission History</h3>
          
          <div v-if="store.notebook.length === 0" class="text-gray-600 text-center py-10 italic">
             No notes submitted yet. Start writing!
          </div>

          <div class="space-y-2">
             <div v-for="note in store.notebook" :key="note.id" 
                  class="flex items-center justify-between bg-[#1a1a1a] border border-[#333] p-3 rounded hover:border-gray-600 transition-colors">
                <div class="flex items-center gap-3">
                   <div class="bg-blue-900/20 p-2 rounded text-blue-400">📝</div>
                   <div>
                      <div class="font-bold text-gray-200">{{ note.title }}</div>
                      <div class="text-xs text-gray-500">{{ note.date }}</div>
                   </div>
                </div>
                <div class="text-right">
                   <div class="text-yellow-500 font-bold font-mono">+{{ note.coins }} 🪙</div>
                   <div class="text-xs text-gray-600">{{ note.wordCount }} words</div>
                </div>
             </div>
          </div>

       </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
const store = useGameStore()

const noteTitle = ref('')
const fileInput = ref(null)

const triggerFileSelect = () => {
    fileInput.value.click()
}

const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 如果没填标题，自动用文件名
    if (!noteTitle.value) {
        noteTitle.value = file.name.replace('.md', '').replace('.txt', '')
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        const content = e.target.result
        store.uploadNote(noteTitle.value, content)
        
        // Reset
        noteTitle.value = ''
        event.target.value = ''
        alert(`Successfully processed! You earned coins based on word count.`)
    }
    reader.readAsText(file)
}
</script>