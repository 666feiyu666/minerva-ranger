<template>
  <div class="flex h-screen w-screen bg-melvor-dark text-gray-200 font-sans overflow-hidden">
    <Sidebar />
    <main class="flex-1 flex flex-col relative bg-[#1a1a1a]">
      
      <ShopView v-if="store.activeView === 'shop'" />
      <ForestView v-else-if="store.activeView === 'forest'" />
      <NotebookView v-else-if="store.activeView === 'notebook'" /> <IdleDashboard v-else-if="store.activeView === 'dashboard' && store.activeProjectId" />
      
      <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-600">
        <div class="text-6xl mb-4 opacity-50">⬅️</div>
        <p class="text-xl">Select a Project to Start</p>
        <p class="text-sm mt-2">Or visit the Shop to buy new seeds</p>
      </div>

    </main>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue'
import IdleDashboard from './components/IdleDashboard.vue'
import ShopView from './components/ShopView.vue'
import ForestView from './components/ForestView.vue'
import NotebookView from './components/NotebookView.vue' // 引入
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
</script>