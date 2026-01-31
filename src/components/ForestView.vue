<template>
  <div class="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative selection:bg-transparent">
    
    <div v-if="!viewingProject" class="flex flex-col h-full">
        <div class="shrink-0 p-6 pb-2">
            <div class="flex justify-between items-center p-6 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-500"
                 :class="store.isNightMode 
                   ? 'bg-[#1a1a1a]/80 border-gray-700' 
                   : 'bg-white/70 border-white/60 shadow-lg ring-1 ring-black/5'">
                <div>
                    <h2 class="text-3xl font-bold flex items-center gap-3 transition-colors"
                        :class="store.isNightMode ? 'text-green-500' : 'text-emerald-600'">
                        <span>🧭</span> 巡林
                    </h2>
                    <p class="text-sm mt-1 transition-colors"
                       :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
                       管理你的生态数据，点击卡片进入 3D 视图。
                    </p>
                </div>
                <div class="flex flex-col items-end">
                    <div class="text-2xl font-bold transition-colors"
                         :class="store.isNightMode ? 'text-white' : 'text-gray-800'">
                        {{ totalTreesGlobal }} <span :class="store.isNightMode ? 'text-green-500' : 'text-emerald-600'">Trees Planted</span>
                    </div>
                    <div class="text-xs" :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">Global Ecosystem</div>
                </div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
            
            <div v-if="store.projects.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-600">
                <div class="text-4xl mb-2">🏜️</div>
                <p>No forests found. Start a project to plant trees!</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                <div v-for="project in store.projects" :key="project.id" 
                    class="border rounded-lg overflow-hidden flex flex-col transition-all shadow-lg group relative cursor-pointer backdrop-blur-sm"
                    :class="store.isNightMode 
                      ? 'bg-[#1a1a1a]/80 border-gray-700 hover:border-green-500 hover:shadow-green-900/20' 
                      : 'bg-white/60 border-white/60 hover:bg-white/90 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300'"
                    @click="openInspection(project)">
                    
                    <div class="p-4 border-b flex justify-between items-center transition-colors"
                         :class="store.isNightMode 
                           ? 'bg-[#202020]/50 border-gray-700 group-hover:bg-[#252525]/80' 
                           : 'bg-white/40 border-gray-100 group-hover:bg-white/60'">
                        <div class="flex items-center gap-3">
                            <div class="text-2xl group-hover:scale-110 transition-transform">{{ project.icon }}</div>
                            <div>
                                <h3 class="font-bold transition-colors"
                                    :class="store.isNightMode ? 'text-gray-200' : 'text-gray-800'">
                                    {{ project.name }}
                                </h3>
                                <div class="text-xs font-bold"
                                     :class="store.isNightMode ? 'text-blue-400' : 'text-blue-600'">
                                     Level {{ project.level }}
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button @click.stop="handleRename(project)" 
                                    class="p-2 rounded transition-colors"
                                    :class="store.isNightMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'"
                                    title="Rename">
                                ✏️
                            </button>
                            <button @click.stop="handleDelete(project)" 
                                    class="p-2 rounded transition-colors"
                                    :class="store.isNightMode ? 'text-gray-400 hover:bg-red-900/50 hover:text-red-400' : 'text-gray-400 hover:bg-red-100 hover:text-red-600'"
                                    title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-4 flex-1 min-h-[120px] relative transition-colors"
                         :class="store.isNightMode ? 'bg-[#151515]/80' : 'bg-gray-50/50'">
                        <div class="absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none opacity-0 group-hover:opacity-100 z-10">
                            <span class="px-3 py-1 rounded-full border backdrop-blur font-bold uppercase tracking-wider text-xs shadow-xl"
                                  :class="store.isNightMode 
                                    ? 'bg-black/80 text-white border-green-500/50' 
                                    : 'bg-white/90 text-emerald-800 border-emerald-500/50'">
                                Click to Inspect 3D View
                            </span>
                        </div>

                        <div v-if="!project.forest || Object.keys(project.forest).length === 0" class="h-full flex items-center justify-center text-sm italic"
                             :class="store.isNightMode ? 'text-gray-700' : 'text-gray-400'">
                            Soil is empty...
                        </div>
                        
                        <div v-else class="flex flex-wrap gap-2 content-start opacity-100 group-hover:opacity-40 transition-opacity duration-300">
                            <div v-for="(count, treeId) in project.forest" :key="treeId" 
                                class="flex items-center gap-1 border px-2 py-1 rounded-full text-xs"
                                :class="store.isNightMode 
                                  ? 'bg-[#252525] border-[#333] text-gray-300' 
                                  : 'bg-white border-gray-200 text-gray-600 shadow-sm'"
                                title="Trees planted">
                                <span class="text-lg">{{ store.getTreeIcon(treeId) }}</span>
                                <span class="font-bold">x{{ count }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="p-2 border-t flex justify-between items-center px-4 transition-colors"
                         :class="store.isNightMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white/40 border-gray-100'">
                        <div class="text-[10px] uppercase tracking-widest"
                             :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'">
                            {{ Object.keys(project.forest || {}).length }} Species
                        </div>
                        <div class="text-sm font-mono font-bold"
                             :class="store.isNightMode ? 'text-green-500' : 'text-emerald-600'">
                            {{ project.totalTrees }} 🌲
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="absolute inset-0 z-50 flex flex-col animate-in fade-in zoom-in duration-300 transition-colors"
         :class="store.isNightMode ? 'bg-[#0a0a0a]/95' : 'bg-[#e0f2fe]/95'">
       
       <div class="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
          <button @click="closeInspection" 
                  class="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur transition-all border shadow-lg"
                  :class="store.isNightMode 
                    ? 'text-gray-400 hover:text-white bg-black/50 hover:bg-black/80 border-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 bg-white/50 hover:bg-white/80 border-white/50'">
             <span>←</span> <span class="text-sm font-bold uppercase">Back to Data</span>
          </button>

          <div class="pointer-events-auto border p-4 rounded-xl shadow-2xl min-w-[200px] text-right backdrop-blur-md transition-colors"
               :class="store.isNightMode 
                 ? 'bg-melvor-panel/90 border-melvor-border text-white' 
                 : 'bg-white/80 border-white/60 text-gray-800'">
             <h2 class="text-2xl font-bold mb-1">{{ viewingProject.name }}</h2>
             <div class="text-xs font-bold uppercase tracking-wider mb-3"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-500'">Level {{ viewingProject.level }} Ecosystem</div>
             
             <div class="flex flex-col gap-2">
                 <button v-if="store.activeProjectId !== viewingProject.id" 
                         @click="setActiveAndStay"
                         class="w-full py-2 text-white text-xs font-bold uppercase rounded shadow-lg transition-transform hover:scale-105 active:scale-95"
                         :class="store.isNightMode ? 'bg-green-700 hover:bg-green-600' : 'bg-emerald-500 hover:bg-emerald-400'">
                    🚀 Set as Active Project
                 </button>
                 <div v-else class="w-full py-2 text-xs font-bold uppercase rounded border flex items-center justify-center gap-2"
                      :class="store.isNightMode 
                        ? 'bg-gray-800 text-green-500 border-green-900' 
                        : 'bg-white text-emerald-600 border-emerald-200 shadow-inner'">
                    <span class="animate-pulse">●</span> Currently Active
                 </div>
             </div>
          </div>
       </div>

       <div class="flex-1 flex items-center justify-center relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
            :class="store.isNightMode 
              ? 'bg-gradient-to-b from-[#111] to-[#050505]' 
              : 'bg-gradient-to-b from-sky-100 to-emerald-50/50'"
            @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
          
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[100px] rounded-full pointer-events-none transition-colors duration-1000"
               :class="store.isNightMode ? 'bg-green-900/10' : 'bg-yellow-200/40'"></div>

          <div class="relative transition-transform duration-100 ease-out"
               :style="{ transform: `scale(${zoomLevel}) rotateX(0deg) rotateZ(0deg)` }">
               
               <div class="w-[500px] h-[500px] bg-gradient-to-br from-[#2d4a3e] via-[#1a2e26] to-[#0f1f1a] 
                           rounded-[60px] transform rotate-45 scale-y-50 relative z-0 group-island"
                    :class="store.isNightMode 
                      ? 'shadow-[20px_20px_0px_#05110d] border-[8px] border-[#3d6153]' 
                      : 'shadow-[20px_20px_0px_#1a332a] border-[8px] border-[#4a7a65]'">
                    <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]"></div>
               </div>

               <div class="absolute inset-0 w-[500px] h-[500px] z-10 pointer-events-none">
                  
                  <div v-if="islandTrees.length === 0" class="absolute inset-0 flex items-center justify-center z-50">
                      <div class="px-4 py-2 rounded-full backdrop-blur text-xs font-bold animate-bounce transform -translate-y-10 border"
                           :class="store.isNightMode 
                             ? 'bg-black/60 text-white border-gray-700' 
                             : 'bg-white/80 text-gray-800 border-white shadow-lg'">
                          Empty Island... Go plant some trees!
                      </div>
                  </div>

                  <div v-for="(tree, index) in islandTrees" :key="index"
                       class="absolute transform -translate-x-1/2 -translate-y-[90%] transition-all duration-500 ease-out hover:scale-125 hover:z-[1000] group"
                       :style="{ 
                          left: tree.x + '%', 
                          top: tree.y + '%',
                          zIndex: Math.floor(tree.y)
                       }">
                       
                       <div class="text-4xl filter drop-shadow-xl relative cursor-help pointer-events-auto" :title="tree.name">
                          {{ tree.icon }}
                          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3 blur-sm rounded-full -z-10 transform scale-y-50 transition-colors"
                               :class="store.isNightMode ? 'bg-black/40' : 'bg-black/20'"></div>
                       </div>
                  </div>
               </div>
          </div>

          <div class="absolute bottom-8 right-8 flex flex-col gap-2 pointer-events-auto">
             <button @click="zoomIn" class="w-10 h-10 rounded-lg font-bold shadow-lg border active:scale-95 transition-all"
                     :class="store.isNightMode 
                       ? 'bg-[#333] hover:bg-[#444] text-white border-gray-600' 
                       : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'">+</button>
             <button @click="zoomOut" class="w-10 h-10 rounded-lg font-bold shadow-lg border active:scale-95 transition-all"
                     :class="store.isNightMode 
                       ? 'bg-[#333] hover:bg-[#444] text-white border-gray-600' 
                       : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'">-</button>
          </div>

       </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

// === 全局数据 ===
const totalTreesGlobal = computed(() => {
    return store.projects.reduce((sum, p) => sum + p.totalTrees, 0)
})

// === 状态管理 ===
const viewingProject = ref(null) // 当前正在查看详情的项目，null 表示在画廊模式
const zoomLevel = ref(1.0)
const islandTrees = ref([])

// === 核心：生成 3D 坐标布局 ===
const generateIslandLayout = (project) => {
    if (!project || !project.forest) return []
    const trees = []
    
    // 遍历森林数据
    Object.entries(project.forest).forEach(([treeId, count]) => {
        const treeInfo = store.TREE_TYPES.find(t => t.id === treeId)
        const icon = treeInfo ? treeInfo.icon : '🌲'
        const name = treeInfo ? treeInfo.name : 'Unknown Tree'
        
        // 限制最大渲染数量
        const renderCount = Math.min(count, 50) 
        
        for (let i = 0; i < renderCount; i++) {
            // 在 10% - 90% 的范围内随机生成
            let x = Math.random() * 80 + 10
            let y = Math.random() * 80 + 10
            
            x += (Math.random() - 0.5) * 5
            y += (Math.random() - 0.5) * 5

            trees.push({ id: treeId, icon, name, x, y })
        }
    })

    // 按 Y 轴排序 (渲染层级)
    return trees.sort((a, b) => a.y - b.y)
}

// === 交互动作 ===

const openInspection = (project) => {
    viewingProject.value = project
    islandTrees.value = generateIslandLayout(project)
    zoomLevel.value = 1.0
}

const closeInspection = () => {
    viewingProject.value = null
    islandTrees.value = []
}

const setActiveAndStay = () => {
    if (viewingProject.value) {
        store.selectProject(viewingProject.value.id)
    }
}

const zoomIn = () => { if (zoomLevel.value < 2.0) zoomLevel.value += 0.2 }
const zoomOut = () => { if (zoomLevel.value > 0.5) zoomLevel.value -= 0.2 }

// 管理功能 (重命名/删除)
const handleRename = (project) => {
    const newName = prompt("Rename project:", project.name)
    if (newName && newName.trim() !== "") {
        store.renameProject(project.id, newName.trim())
    }
}

const handleDelete = (project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?\nThis action cannot be undone.`)) {
        store.deleteProject(project.id)
        if (viewingProject.value && viewingProject.value.id === project.id) {
            closeInspection()
        }
    }
}

// 占位函数：未来可以做拖拽旋转
const startDrag = () => {}
const onDrag = () => {}
const stopDrag = () => {}

</script>

<style scoped>
/* 自定义滚动条样式 */
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