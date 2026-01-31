<template>
  <div class="flex flex-col h-full overflow-hidden">
    
    <div class="shrink-0 p-6 pb-2">
      <div 
        class="flex items-center justify-between p-6 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300"
        :class="store.isNightMode 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/70 border-white/60 shadow-lg ring-1 ring-black/5'"
      >
        <div>
          <h2 
            class="text-3xl font-bold transition-colors duration-300 flex items-center gap-3"
            :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
          >
            <span>🏪</span> 商店
          </h2>
          <p 
            class="text-sm mt-1 transition-colors duration-300"
            :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'"
          >
            消耗金币购买稀有树种
          </p>
        </div>

        <div 
          class="px-5 py-2 rounded-full font-mono font-bold text-lg shadow-inner border transition-colors duration-300"
          :class="store.isNightMode 
            ? 'bg-black/40 text-yellow-400 border-gray-600' 
            : 'bg-yellow-50 text-yellow-600 border-yellow-200'"
        >
          🪙 {{ Math.floor(store.coins) }}
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        <div
          v-for="tree in store.TREE_TYPES"
          :key="tree.id"
          class="relative p-5 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] group"
          :class="store.isNightMode 
            ? 'bg-gray-800/50 border-gray-600 text-gray-100 hover:bg-gray-800/60' 
            : 'bg-white/60 border-white/50 text-gray-800 hover:bg-white/70 hover:shadow-xl'"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-bold">{{ tree.name }}</h3>
              <p 
                class="text-xs mt-1 transition-colors"
                :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'"
              >
                {{ tree.desc }}
              </p>
            </div>
            <div class="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{{ tree.icon }}</div>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-4 text-xs font-bold">
               <div class="px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    :class="store.isNightMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-600'">
                  <span>⚡</span> {{ tree.xp }} XP
               </div>
               <div class="px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    :class="store.isNightMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-600'">
                  <span>⏳</span> {{ (tree.time / 60).toFixed(0) }}m
               </div>
          </div>

          <div class="mb-5 flex items-center justify-between text-sm">
            <div class="font-bold flex items-center" 
                 :class="store.isNightMode ? 'text-yellow-400' : 'text-yellow-600'">
               🪙 {{ tree.price }}
            </div>
            <div 
              class="text-xs font-bold px-2 py-0.5 rounded border"
              :class="[
                store.globalLevel >= tree.levelReq 
                  ? (store.isNightMode ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-green-200 text-green-600 bg-green-50')
                  : (store.isNightMode ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-red-200 text-red-500 bg-red-50')
              ]"
            >
              Lv.{{ tree.levelReq }} 解锁
            </div>
          </div>

          <button
            @click="store.buyTree(tree)"
            :disabled="isOwned(tree.id) || store.coins < tree.price || store.globalLevel < tree.levelReq"
            class="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2"
            :class="getBtnClass(tree)"
          >
            <span v-if="isOwned(tree.id)">✅ 已拥有</span>
            <span v-else-if="store.globalLevel < tree.levelReq">🔒 等级不足</span>
            <span v-else-if="store.coins < tree.price">💰 金币不足</span>
            <span v-else>🛒 立即购买</span>
          </button>
        </div>
      </div>
      
      <div 
        class="text-center text-xs pb-8 opacity-60 transition-colors"
        :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
      >
        — 更多稀有物种正在研究中 —
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()

// 判断是否拥有
const isOwned = (treeId) => {
  return store.unlockedTreeIds.includes(treeId)
}

// 动态按钮样式
const getBtnClass = (tree) => {
  // 1. 已拥有
  if (isOwned(tree.id)) {
    return store.isNightMode 
      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
  }
  
  // 2. 等级不足
  if (store.globalLevel < tree.levelReq) {
    return 'bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed'
  }
  
  // 3. 金币不足
  if (store.coins < tree.price) {
    return store.isNightMode
      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
  }
  
  // 4. 可购买 (高亮)
  return 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 hover:shadow-lg active:scale-95 shadow-green-900/20'
}
</script>

<style scoped>
/* 滚动条样式适配 (与 ForestView 保持一致) */
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