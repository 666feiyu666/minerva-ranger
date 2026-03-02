<template>
  <div class="flex-1 p-6 flex flex-col h-full overflow-hidden bg-transparent relative">
    
    <div 
      class="rounded-2xl p-6 mb-6 shadow-lg shrink-0 border backdrop-blur-md transition-all duration-300"
      :class="store.isNightMode 
        ? 'bg-[#1a1a1a]/80 border-gray-700' 
        : 'bg-white/70 border-white/60 shadow-xl ring-1 ring-black/5'"
    >
       <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <div class="text-xs uppercase tracking-widest mb-1 font-bold" 
                 :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
              Knowledge Base
            </div>
            <h2 class="text-3xl font-bold tracking-wide" 
                :class="store.isNightMode ? 'text-white' : 'text-gray-800'">
              巡林官手记
            </h2>
         </div>
         
         <div class="flex gap-2 p-1 rounded-lg border transition-colors"
              :class="store.isNightMode ? 'bg-[#0f0f0f] border-gray-700' : 'bg-gray-200/50 border-gray-300'">
            
            <button @click="currentTab = 'planting'"
                    class="px-4 py-2 rounded-md font-mono text-sm font-bold transition-all border border-transparent"
                    :class="currentTab === 'planting' 
                      ? 'bg-[#0a0a0a] text-green-400 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                      : (store.isNightMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')">
               >_ 植树日志
            </button>
            
            <button @click="currentTab = 'ranger'"
                    class="px-4 py-2 rounded-md text-sm font-bold transition-all border border-transparent flex items-center gap-2"
                    :class="currentTab === 'ranger' 
                      ? (store.isNightMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm') 
                      : (store.isNightMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')">
               <span>📝</span> 巡林日志
            </button>
         </div>
       </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-24">
       
       <template v-if="currentTab === 'planting'">
          <div v-if="plantingLogs.length === 0" class="text-center mt-20 font-mono text-green-700/50 animate-pulse">
             > NO_PLANTING_RECORDS_FOUND. <br>
             > AWAITING_FIRST_HARVEST...
          </div>
          
          <div v-for="note in plantingLogs" :key="note.id"
               class="bg-[#0a0a0a] border border-green-800/50 hover:border-green-500/80 rounded-lg p-5 font-mono text-green-500 shadow-md relative group transition-colors">
             
             <div class="flex justify-between items-start mb-3 border-b border-green-900/50 pb-2">
                <div class="font-bold text-green-400">{{ note.title }}</div>
                <div class="text-xs text-green-700">{{ note.date }}</div>
             </div>
             
             <div class="text-sm text-green-300 whitespace-pre-wrap leading-relaxed py-2">
               {{ note.content || '> [NO_TEXT_DATA_PROVIDED]' }}
             </div>

             <div class="mt-4 flex flex-wrap gap-4 text-xs text-green-700">
                <span class="bg-green-900/20 px-2 py-1 rounded">> WORDS: {{ note.wordCount }}</span>
                <span class="bg-green-900/20 px-2 py-1 rounded">> COINS_EARNED: +{{ note.coins }}</span>
                <span v-if="note.projectIds?.length" class="bg-green-900/20 px-2 py-1 rounded">
                  > TARGET_ID: {{ note.projectIds.join(', ') }}
                </span>
             </div>

             <button @click="store.deleteNote(note.id)" 
                     class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-green-800 hover:text-red-500 hover:bg-red-900/20 px-2 py-0.5 rounded transition-all">
                [DEL]
             </button>
          </div>
       </template>

       <template v-if="currentTab === 'ranger'">
          <div v-if="rangerLogs.length === 0" 
               class="text-center mt-20 font-medium transition-colors"
               :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
             <p class="text-4xl mb-4 grayscale opacity-50">🪶</p>
             <p>暂无巡林日志。<br>属于你的地图叙事即将展开...</p>
             <button class="mt-6 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm"
                     :class="store.isNightMode ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'">
               + 新建巡林日志 (开发中)
             </button>
          </div>
          
          <div v-for="note in rangerLogs" :key="note.id"
               class="border rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative group"
               :class="store.isNightMode ? 'bg-[#1e1e1e]/80 border-gray-700 hover:border-gray-500' : 'bg-white/80 border-gray-200 hover:border-emerald-300'">
               
               <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-lg" :class="store.isNightMode ? 'text-white' : 'text-gray-800'">
                    {{ note.title }}
                  </h3>
                  <span class="text-xs" :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
                    {{ note.date }}
                  </span>
               </div>
               
               <p class="text-sm whitespace-pre-wrap" :class="store.isNightMode ? 'text-gray-300' : 'text-gray-600'">
                 {{ note.content }}
               </p>
               
               <button @click="store.deleteNote(note.id)" 
                       class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all"
                       :class="store.isNightMode ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'">
                  🗑️
               </button>
          </div>
       </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

// 'planting' (植树日志) 或 'ranger' (巡林日志)
const currentTab = ref('planting') 

// 根据我们在 gameStore 中提交 Harvest 时设定的标题 '[植树日志]' 来自动分类
const plantingLogs = computed(() => {
  return store.notebook.filter(note => note.title.startsWith('[植树日志]'))
})

const rangerLogs = computed(() => {
  return store.notebook.filter(note => !note.title.startsWith('[植树日志]'))
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>