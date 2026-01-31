<template>
  <div class="flex-1 p-6 overflow-y-auto custom-scrollbar">
    
    <div class="flex items-center justify-between mb-6">
       <h2 class="text-2xl font-bold flex items-center gap-2 transition-colors"
           :class="store.isNightMode ? 'text-gray-100' : 'text-gray-800'">
         <span class="text-3xl">🛒</span> Seeds Shop
       </h2>
       
       <div class="px-4 py-2 rounded-full font-mono font-bold text-lg border transition-all"
            :class="store.isNightMode 
              ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' 
              : 'bg-yellow-100 text-yellow-700 border-yellow-300 shadow-sm'">
          💰 {{ store.coins }}
       </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="tree in store.TREE_TYPES" :key="tree.id" 
           class="relative border-2 rounded-lg p-5 flex flex-col items-center text-center transition-all duration-300 group backdrop-blur-sm"
           :class="[
             // 卡片背景与边框适配
             store.isNightMode 
               ? 'bg-[#1a1a1a]/80 border-gray-700 hover:border-gray-500' 
               : 'bg-white/60 border-white/60 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-white/80',
             // 已拥有状态的特殊样式
             isOwned(tree) ? 'opacity-70 grayscale-[0.3]' : ''
           ]"
      >
          <div class="text-5xl mb-4 transform group-hover:scale-110 transition-transform filter drop-shadow-sm">{{ tree.icon }}</div>
          
          <h3 class="text-xl font-bold mb-1"
              :class="store.isNightMode ? 'text-gray-100' : 'text-gray-900'">
              {{ tree.name }}
          </h3>
          <p class="text-xs mb-4 h-8 flex items-center justify-center px-2"
             :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
             {{ tree.desc }}
          </p>

          <div class="w-full space-y-2 mb-4 text-xs font-bold">
             <div class="flex justify-between items-center px-2 py-1 rounded"
                  :class="store.isNightMode ? 'bg-black/20' : 'bg-gray-100'">
                <span :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">XP/H</span>
                <span class="text-blue-500">+{{ tree.xp }}</span>
             </div>
             <div class="flex justify-between items-center px-2 py-1 rounded"
                  :class="store.isNightMode ? 'bg-black/20' : 'bg-gray-100'">
                <span :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">GROW</span>
                <span :class="store.isNightMode ? 'text-gray-300' : 'text-gray-600'">{{ tree.time / 60 }}m</span>
             </div>
             <div class="flex justify-between items-center px-2 py-1 rounded"
                  :class="store.isNightMode ? 'bg-black/20' : 'bg-gray-100'">
                <span :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">REQ</span>
                <span :class="store.globalLevel >= tree.levelReq ? 'text-green-500' : 'text-red-500'">Lv. {{ tree.levelReq }}</span>
             </div>
          </div>

          <button 
             @click="store.buyTree(tree)"
             :disabled="isOwned(tree) || store.coins < tree.price || store.globalLevel < tree.levelReq"
             class="w-full py-2 rounded font-bold text-sm uppercase tracking-wider transition-all"
             :class="getBtnClass(tree)"
          >
             <span v-if="isOwned(tree)">Owned</span>
             <span v-else-if="store.globalLevel < tree.levelReq">Locked (Lv.{{tree.levelReq}})</span>
             <span v-else>Buy ({{ tree.price }})</span>
          </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore'
const store = useGameStore()

const isOwned = (tree) => store.unlockedTreeIds.includes(tree.id)

const getBtnClass = (tree) => {
    if (isOwned(tree)) {
        return store.isNightMode 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
    }
    if (store.globalLevel < tree.levelReq) {
        return store.isNightMode
            ? 'bg-red-900/20 text-red-700 cursor-not-allowed border border-red-900/30'
            : 'bg-red-50 text-red-300 cursor-not-allowed border border-red-100'
    }
    if (store.coins < tree.price) {
        return store.isNightMode
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
    }
    // 可购买状态
    return store.isNightMode
        ? 'bg-green-700 hover:bg-green-600 text-white shadow-lg shadow-green-900/50'
        : 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-200'
}
</script>