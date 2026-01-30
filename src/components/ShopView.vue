<template>
  <div class="flex-1 p-6 flex flex-col h-full bg-[#121212] overflow-hidden">
    
    <div class="flex justify-between items-center mb-6 shrink-0 bg-melvor-panel p-6 rounded-lg border border-melvor-border shadow-lg">
       <div>
          <h2 class="text-3xl font-bold text-yellow-500 flex items-center gap-3">
            <span>🛒</span> 糖水菠萝的商店
          </h2>
          <p class="text-gray-400 text-sm mt-1">糖水菠萝一点都不黑心。</p>
       </div>
       <div class="flex flex-col items-end">
          <div class="flex items-center gap-2 bg-black/40 px-5 py-2 rounded-full border border-yellow-900/50 mb-2 cursor-pointer" @click="store.cheatAddCoins">
             <span class="text-2xl">🪙</span>
             <span class="text-2xl font-bold text-yellow-400 font-mono">{{ store.coins }}</span>
          </div>
          <div class="text-xs text-gray-500">Global Level: <span class="text-blue-400 font-bold text-sm">{{ store.globalLevel }}</span></div>
       </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
       <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          <div v-for="tree in store.TREE_TYPES" :key="tree.id"
             :class="['relative p-5 rounded-lg border-2 flex flex-col transition-all select-none',
             store.unlockedTreeIds.includes(tree.id) ? 'bg-[#1a251a] border-green-900/50 opacity-70' : 'bg-melvor-panel border-melvor-border hover:border-gray-500']"
          >
             <div class="flex items-center gap-4 mb-4">
                <div class="text-4xl bg-[#2d2d2d] w-16 h-16 flex items-center justify-center rounded-full border border-[#3d3d3d] shadow-lg">
                   {{ tree.icon }}
                </div>
                <div>
                   <h3 class="font-bold text-gray-100 text-lg">{{ tree.name }}</h3>
                   <div class="text-xs text-blue-400 font-bold bg-blue-900/20 px-2 py-0.5 rounded mt-1 inline-block">
                      XP Reward: {{ tree.xp }}
                   </div>
                </div>
             </div>
             
             <p class="text-xs text-gray-500 mb-4 h-8">{{ tree.desc }}</p>

             <div class="mt-auto">
                
                <div v-if="store.unlockedTreeIds.includes(tree.id)" class="w-full py-2 bg-green-900/20 border border-green-800/50 text-green-500 text-center rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                   <span>✔</span> Owned
                </div>

                <button v-else-if="store.globalLevel < tree.levelReq" disabled class="w-full py-2 bg-black/40 border border-gray-800 text-gray-600 rounded cursor-not-allowed flex items-center justify-center gap-2">
                   <span>🔒</span> Requires Lv.{{ tree.levelReq }}
                </button>

                <button v-else @click="store.buyTree(tree)" 
                   :disabled="store.coins < tree.price"
                   :class="['w-full py-2 border rounded font-bold flex items-center justify-center gap-2 transition-all shadow-lg',
                   store.coins >= tree.price ? 'bg-yellow-700 hover:bg-yellow-600 text-white border-yellow-500 hover:scale-105' : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed']">
                   <span>🛒</span> Buy: {{ tree.price }} 🪙
                </button>

             </div>
          </div>

       </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore'
const store = useGameStore()
</script>