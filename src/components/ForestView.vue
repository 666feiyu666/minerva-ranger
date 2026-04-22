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
                        <span>🧭</span> 
                        {{ currentThemeName === '全局' ? '全局巡林' : currentThemeName + ' - 领地巡视' }}
                    </h2>
                    <p class="text-sm mt-1 transition-colors"
                       :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
                        点击卡片进入森林视图 (Terraria Mode)
                    </p>
                </div>
                <div class="flex flex-col items-end">
                    <div class="text-2xl font-bold transition-colors"
                         :class="store.isNightMode ? 'text-white' : 'text-gray-800'">
                        {{ displayTreeCount }} <span :class="store.isNightMode ? 'text-green-500' : 'text-emerald-600'">Trees</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                <div v-for="project in displayProjects" :key="project.id" 
                    class="border rounded-lg overflow-hidden flex flex-col transition-all shadow-lg group relative cursor-pointer backdrop-blur-sm"
                    :class="store.isNightMode 
                      ? 'bg-[#1a1a1a]/80 border-gray-700 hover:border-green-500' 
                      : 'bg-white/60 border-white/60 hover:bg-white/90 hover:border-emerald-300'"
                    @click="openInspection(project)">
                    
                    <div class="p-4 border-b flex justify-between items-center transition-colors"
                         :class="store.isNightMode ? 'bg-[#202020]/50 border-gray-700' : 'bg-white/40 border-gray-100'">
                        
                        <div class="flex items-center gap-3">
                            <div class="text-2xl">{{ project.icon }}</div>
                            <h3 class="font-bold" :class="store.isNightMode ? 'text-gray-200' : 'text-gray-800'">
                                {{ project.name }}
                            </h3>
                        </div>

                        <div class="px-2 py-1 rounded text-xs font-bold border transition-colors flex items-center gap-1"
                             :class="store.isNightMode 
                             ? 'bg-green-900/30 text-green-400 border-green-800' 
                             : 'bg-green-50 text-emerald-600 border-green-200'">
                            <span>🌲</span>
                            <span>{{ project.totalTrees }}</span>
                        </div>
                    </div>
                    
                    <div class="p-4 flex-1 min-h-[120px] relative transition-colors flex flex-col justify-center"
                         :class="store.isNightMode ? 'bg-[#151515]/80' : 'bg-gray-50/50'">
                         
                         <div v-if="getProjectTreeStats(project).length > 0" 
                              class="grid grid-cols-3 gap-2 w-full">
                            
                            <div v-for="tree in getProjectTreeStats(project)" :key="tree.id"
                                 class="flex flex-col items-center p-2 rounded border transition-colors"
                                 :class="store.isNightMode 
                                   ? 'bg-black/40 border-gray-700' 
                                   : 'bg-white border-gray-200 shadow-sm'">
                               
                               <img :src="tree.icon" class="w-8 h-8 object-contain pixel-art mb-1" />
                               
                               <span class="text-xs font-bold"
                                     :class="store.isNightMode ? 'text-gray-300' : 'text-gray-700'">
                                 x{{ tree.count }}
                               </span>
                            </div>
                         </div>

                         <div v-else class="flex flex-col items-center justify-center opacity-50 h-full">
                             <span class="text-2xl mb-2">🌱</span>
                             <span class="text-xs uppercase tracking-widest font-bold">No Trees Yet</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="absolute inset-0 z-50 flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden bg-black">
     
        <div class="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-[100] pointer-events-none">
            <button @click="closeInspection" 
                    class="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur transition-all border shadow-lg group"
                    :class="store.isNightMode 
                    ? 'text-gray-200 bg-black/50 border-gray-700 hover:bg-black/70' 
                    : 'text-gray-700 bg-white/50 border-white/50 hover:bg-white/80'">
            <span>←</span> <span class="text-sm font-bold uppercase group-hover:pl-1 transition-all">Back</span>
            </button>

            <div class="pointer-events-auto border p-4 rounded-xl shadow-2xl backdrop-blur-md transition-colors min-w-[200px]"
                :class="store.isNightMode 
                ? 'bg-gray-900/80 border-gray-700 text-white' 
                : 'bg-white/80 border-white/60 text-gray-800'">
                
                <div class="flex justify-between items-start mb-1">
                    <h2 class="text-xl font-bold">{{ viewingProject.name }}</h2>
                    <span class="text-sm font-bold flex items-center gap-1"
                          :class="store.isNightMode ? 'text-green-400' : 'text-emerald-600'">
                        🌲 {{ viewingProject.totalTrees }}
                    </span>
                </div>

                <div class="text-[10px] text-right opacity-70 mt-1 flex items-center justify-end gap-1">
                    <span>🖱️/✋</span> Scroll horizontally
                </div>
                <button v-if="store.activeProjectId !== viewingProject.id" 
                        @click="setActiveAndStay"
                        class="mt-2 w-full py-1.5 text-white text-[10px] font-bold uppercase rounded shadow bg-emerald-500 hover:bg-emerald-400">
                    Set Active
                </button>
            </div>
        </div>

        <div class="flex-1 relative w-full h-full overflow-hidden">
            
            <div class="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar z-10" 
                 ref="scrollContainer"
                 @wheel.prevent="handleWheel">
                
                <div class="relative h-full flex items-end transition-all duration-300 min-w-full"
                     :style="dynamicWorldStyle">
                
                    <div class="absolute inset-0 z-0 pixel-art pointer-events-none"
                        :style="{ 
                            backgroundImage: `url(${store.isNightMode ? bgForestNight : bgForestDay})`,
                            backgroundRepeat: 'repeat-x', 
                            backgroundPosition: 'bottom left',
                            backgroundSize: 'auto 100%' 
                        }">
                    </div>

                    <div class="absolute bottom-0 left-0 right-0 z-20 pixel-art pointer-events-none"
                        :style="{ 
                            height: '64px',
                            backgroundImage: `url(${normalLandImg})`,
                            backgroundRepeat: 'repeat-x', 
                            backgroundPosition: 'bottom left',
                            backgroundSize: 'auto 100%', 
                            filter: store.isNightMode ? 'brightness(0.6)' : 'none'
                        }">
                    </div>

                    <div class="shrink-0 w-10 h-10"></div>

                    <div class="flex items-end relative z-30 mb-[48px]"> 
                        <div v-if="flatForest.length === 0" class="w-[200px] flex flex-col items-center justify-center opacity-60 mb-10 ml-10">
                            <div class="text-4xl animate-bounce mb-2">🌱</div>
                            <span class="bg-black/40 text-white px-3 py-1 rounded text-xs whitespace-nowrap">Empty world... Plant something!</span>
                        </div>

                        <div v-for="(tree, index) in flatForest" :key="index"
                            class="relative flex flex-col items-center group transition-all duration-300 hover:scale-105 origin-bottom shrink-0"
                            :style="{ width: '120px', marginRight: '-30px' }">
                            <img :src="tree.icon" 
                                class="w-auto h-[180px] object-contain pixel-art drop-shadow-2xl cursor-pointer"
                                :class="store.isNightMode ? 'brightness-75' : ''"
                                :title="tree.name" />
                        </div>
                    </div>

                    <div class="shrink-0 w-[50vw] h-[200px] flex items-end pb-20 pl-20 opacity-30 group pointer-events-none">
                         <div class="border-l-4 border-dashed border-white/20 h-48 flex flex-col justify-end pl-4">
                             <span class="text-xl font-bold uppercase tracking-widest text-white/50 drop-shadow-lg whitespace-nowrap">
                                 Future Territory
                             </span>
                         </div>
                    </div>

                </div>
            </div>

        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

// 素材导入
import normalLandImg from '@/assets/land/normal_land.png'
import bgForestDay from '@/assets/background/normal_background_day.png'
import bgForestNight from '@/assets/background/normal_background_night.png'

const viewingProject = ref(null) 
const scrollContainer = ref(null)

// === 【新增】：基于 activeThemeId 的计算属性 ===

// 1. 根据当前是否选中了某个主题，动态过滤要展示的项目
const displayProjects = computed(() => {
  if (store.activeThemeId) {
    return store.projects.filter(p => p.themeId === store.activeThemeId)
  }
  return store.projects // 如果没有 activeThemeId（比如从侧边栏直接点击），则显示全局
})

// 2. 动态计算当前视图下的树木总数
const displayTreeCount = computed(() => {
  return displayProjects.value.reduce((sum, p) => sum + p.totalTrees, 0)
})

// 3. 动态获取当前主题的名字（用于顶部标题显示）
const currentThemeName = computed(() => {
  if (store.activeThemeId) {
    const theme = store.themes.find(t => t.id === store.activeThemeId)
    return theme ? theme.name : '全局'
  }
  return '全局'
})

// [新增] 获取项目内具体的树木统计
const getProjectTreeStats = (project) => {
  if (!project.forest) return []
  // 遍历 forest 对象 { t1: 5, t2: 3 }
  return Object.entries(project.forest)
    .map(([id, count]) => {
      const treeType = store.TREE_TYPES.find(t => t.id === id)
      return treeType ? { ...treeType, count } : null
    })
    .filter(item => item && item.count > 0) // 过滤掉无效或数量为0的
    .sort((a, b) => b.xp - a.xp) // 按高级程度排序，高级树排前面
}

// 将森林数据展平为数组
const flatForest = computed(() => {
  if (!viewingProject.value || !viewingProject.value.forest) return []
  const list = []
  Object.entries(viewingProject.value.forest).forEach(([treeId, count]) => {
    const treeData = store.TREE_TYPES.find(t => t.id === treeId)
    if (!treeData) return
    for (let i = 0; i < count; i++) {
      list.push({
        ...treeData, 
        instanceId: `${treeId}-${i}`
      })
    }
  })
  // 这里暂时不随机打乱，保证每次进入顺序一致，如果需要随机可自行加上 .sort
  return list
})

// === 核心逻辑：动态计算世界宽度 ===
// 根据树的数量计算总宽度，确保容器能容纳所有内容
const dynamicWorldStyle = computed(() => {
  const treeWidth = 90 // 树的有效宽度 (120px - 30px overlap)
  const startPadding = 40 // 起始 padding
  const endSpacer = window.innerWidth * 0.5 // 终点留白 (50vw)
  
  // 计算内容所需的总像素宽度
  const contentWidth = startPadding + (flatForest.value.length * treeWidth) + endSpacer
  
  // 确保至少占满一屏
  return {
    width: `${Math.max(window.innerWidth, contentWidth)}px` 
  }
})

const openInspection = (project) => {
    viewingProject.value = project
    // 打开时自动滚动到最左侧 (初始位置)
    nextTick(() => { 
        if (scrollContainer.value) {
            scrollContainer.value.scrollLeft = 0
        }
    })
}

const closeInspection = () => { viewingProject.value = null }
const setActiveAndStay = () => { if (viewingProject.value) store.selectProject(viewingProject.value.id) }

// 🖱️ 优化的滚轮处理
const handleWheel = (e) => {
    if (!scrollContainer.value) return;
    
    // 不同的设备 deltaY 的值差异很大。
    // 触摸板通常较小，普通鼠标滚轮较大。
    const scrollSpeed = 1.5; 
    let delta = e.deltaY * scrollSpeed;

    // 支持横向滚动设备 (e.deltaX)
    if (e.deltaX) {
        delta += e.deltaX * scrollSpeed;
    }

    scrollContainer.value.scrollLeft += delta;
}
</script>

<style scoped>
.pixel-art {
  image-rendering: pixelated; 
  image-rendering: crisp-edges;
}

/* === 修改这里：让滚动条可见且美观 === */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px; /* 纵向滚动条宽度 */
  height: 6px; /* 横向滚动条高度 (用于森林内部滚动) */
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; 
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3); /* 半透明灰色 */
  border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5); /* 鼠标悬停变深 */
}

/* Firefox 适配 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}
</style>
