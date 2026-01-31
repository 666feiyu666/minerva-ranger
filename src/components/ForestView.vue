<template>
  <div class="flex-1 flex flex-col h-full bg-[#121212] overflow-hidden relative selection:bg-transparent">
    
    <div v-if="!viewingProject" class="flex flex-col h-full">
        <div class="shrink-0 p-6 pb-2">
            <div class="flex justify-between items-center bg-melvor-panel p-6 rounded-lg border border-melvor-border shadow-lg">
                <div>
                    <h2 class="text-3xl font-bold text-green-500 flex items-center gap-3">
                        <span>🧭</span> 巡林
                    </h2>
                    <p class="text-gray-400 text-sm mt-1">管理你的生态数据，点击卡片进入 3D 视图。</p>
                </div>
                <div class="flex flex-col items-end">
                    <div class="text-2xl font-bold text-white">{{ totalTreesGlobal }} <span class="text-green-500">Trees Planted</span></div>
                    <div class="text-xs text-gray-500">Global Ecosystem</div>
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
                    class="bg-melvor-panel border border-melvor-border rounded-lg overflow-hidden flex flex-col hover:border-green-500 hover:shadow-green-900/20 transition-all shadow-lg group relative cursor-pointer"
                    @click="openInspection(project)">
                    
                    <div class="p-4 bg-[#202020] border-b border-melvor-border flex justify-between items-center group-hover:bg-[#252525] transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="text-2xl group-hover:scale-110 transition-transform">{{ project.icon }}</div>
                            <div>
                                <h3 class="font-bold text-gray-200">{{ project.name }}</h3>
                                <div class="text-xs text-blue-400 font-bold">Level {{ project.level }}</div>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button @click.stop="handleRename(project)" class="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Rename">
                                ✏️
                            </button>
                            <button @click.stop="handleDelete(project)" class="p-2 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-4 flex-1 bg-[#151515] min-h-[120px] relative">
                        <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span class="bg-black/80 text-white text-xs px-3 py-1 rounded-full border border-green-500/50 backdrop-blur font-bold uppercase tracking-wider">
                                Click to Inspect 3D View
                            </span>
                        </div>

                        <div v-if="!project.forest || Object.keys(project.forest).length === 0" class="h-full flex items-center justify-center text-gray-700 text-sm italic">
                            Soil is empty...
                        </div>
                        
                        <div v-else class="flex flex-wrap gap-2 content-start">
                            <div v-for="(count, treeId) in project.forest" :key="treeId" 
                                class="flex items-center gap-1 bg-[#252525] border border-[#333] px-2 py-1 rounded-full text-xs text-gray-300"
                                title="Trees planted">
                                <span class="text-lg">{{ store.getTreeIcon(treeId) }}</span>
                                <span class="font-bold">x{{ count }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="p-2 bg-[#1a1a1a] border-t border-melvor-border flex justify-between items-center px-4">
                        <div class="text-[10px] text-gray-600 uppercase tracking-widest">
                            {{ Object.keys(project.forest || {}).length }} Species
                        </div>
                        <div class="text-sm font-mono text-green-500 font-bold">
                            {{ project.totalTrees }} 🌲
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="absolute inset-0 z-50 bg-[#0a0a0a] flex flex-col animate-in fade-in zoom-in duration-300">
       
       <div class="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
          <button @click="closeInspection" 
                  class="pointer-events-auto flex items-center gap-2 text-gray-400 hover:text-white bg-black/50 hover:bg-black/80 px-4 py-2 rounded-full backdrop-blur transition-all border border-gray-700">
             <span>←</span> <span class="text-sm font-bold uppercase">Back to Data</span>
          </button>

          <div class="pointer-events-auto bg-melvor-panel border border-melvor-border p-4 rounded-xl shadow-2xl min-w-[200px] text-right backdrop-blur-md bg-opacity-90">
             <h2 class="text-2xl font-bold text-white mb-1">{{ viewingProject.name }}</h2>
             <div class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Level {{ viewingProject.level }} Ecosystem</div>
             
             <div class="flex flex-col gap-2">
                 <button v-if="store.activeProjectId !== viewingProject.id" 
                         @click="setActiveAndStay"
                         class="w-full py-2 bg-green-700 hover:bg-green-600 text-white text-xs font-bold uppercase rounded shadow-lg transition-transform hover:scale-105 active:scale-95">
                    🚀 Set as Active Project
                 </button>
                 <div v-else class="w-full py-2 bg-gray-800 text-green-500 text-xs font-bold uppercase rounded border border-green-900 flex items-center justify-center gap-2">
                    <span class="animate-pulse">●</span> Currently Active
                 </div>
             </div>
          </div>
       </div>

       <div class="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#111] to-[#050505] cursor-grab active:cursor-grabbing select-none"
            @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
          
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-900/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div class="relative transition-transform duration-100 ease-out"
               :style="{ transform: `scale(${zoomLevel}) rotateX(0deg) rotateZ(0deg)` }">
               
               <div class="w-[500px] h-[500px] bg-gradient-to-br from-[#2d4a3e] via-[#1a2e26] to-[#0f1f1a] 
                           rounded-[60px] transform rotate-45 scale-y-50 shadow-[20px_20px_0px_#05110d] border-[8px] border-[#3d6153]
                           relative z-0 group-island">
                    <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]"></div>
               </div>

               <div class="absolute inset-0 w-[500px] h-[500px] z-10 pointer-events-none">
                  
                  <div v-if="islandTrees.length === 0" class="absolute inset-0 flex items-center justify-center z-50">
                      <div class="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur text-xs font-bold animate-bounce transform -translate-y-10">
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
                          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-black/40 blur-sm rounded-full -z-10 transform scale-y-50"></div>
                       </div>
                  </div>
               </div>
          </div>

          <div class="absolute bottom-8 right-8 flex flex-col gap-2 pointer-events-auto">
             <button @click="zoomIn" class="w-10 h-10 bg-[#333] hover:bg-[#444] text-white rounded-lg font-bold shadow-lg border border-gray-600 active:scale-95 transition-transform">+</button>
             <button @click="zoomOut" class="w-10 h-10 bg-[#333] hover:bg-[#444] text-white rounded-lg font-bold shadow-lg border border-gray-600 active:scale-95 transition-transform">-</button>
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
        
        // 限制最大渲染数量，防止几千棵树卡死页面
        // 我们可以只渲染前 100 棵或者做按比例缩减
        const renderCount = Math.min(count, 50) 
        
        for (let i = 0; i < renderCount; i++) {
            // 在 10% - 90% 的范围内随机生成
            let x = Math.random() * 80 + 10
            let y = Math.random() * 80 + 10
            
            // 简单的抖动防止重叠过于死板
            x += (Math.random() - 0.5) * 5
            y += (Math.random() - 0.5) * 5

            trees.push({ id: treeId, icon, name, x, y })
        }
    })

    // 按 Y 轴排序 (虽然 CSS z-index 处理了遮挡，但 DOM 顺序也有助于优化)
    return trees.sort((a, b) => a.y - b.y)
}

// === 交互动作 ===

// 打开 3D 视图
const openInspection = (project) => {
    // 先设置项目，然后生成布局
    viewingProject.value = project
    islandTrees.value = generateIslandLayout(project)
    zoomLevel.value = 1.0
    
    // 如果你想点进去就顺便选中它为 Active Project，可以解开下面这行
    // store.selectProject(project.id)
}

// 关闭 3D 视图
const closeInspection = () => {
    viewingProject.value = null
    islandTrees.value = []
}

// 在详情页激活项目
const setActiveAndStay = () => {
    if (viewingProject.value) {
        store.selectProject(viewingProject.value.id)
    }
}

// 缩放逻辑
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
        // 如果正在查看的项目被删除了，退回主界面
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
  background: #1a1a1a; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #333; 
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555; 
}
</style>