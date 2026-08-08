<template>
  <aside 
    class="w-72 flex-shrink-0 border-r flex flex-col h-full select-none transition-all duration-500 backdrop-blur-md z-20"
    :class="store.isNightMode 
      ? 'bg-black/60 border-white/10' 
      : 'bg-white/80 border-gray-200/50 shadow-xl'"
  >
    <div class="h-16 flex items-center justify-center border-b shrink-0 transition-colors"
         :class="store.isNightMode ? 'border-white/10 bg-black/20' : 'border-gray-200/50 bg-white/40'">
      <h1 class="text-xl font-bold tracking-widest uppercase flex items-center gap-2"
          :class="store.isNightMode ? 'text-green-500' : 'text-emerald-700'">
        <span>🌲</span> 密涅瓦的巡林官
      </h1>
    </div>

    <div class="px-4 py-3 border-b shrink-0 transition-colors"
         :class="store.isNightMode ? 'border-white/10 bg-black/10' : 'border-gray-200/50 bg-white/20'">
      <div class="flex justify-between items-end text-xs mb-1">
        <span class="font-bold" :class="store.isNightMode ? 'text-purple-400' : 'text-purple-600'">Global Rank {{ store.globalLevel }}</span>
        <span :class="store.isNightMode ? 'text-gray-500' : 'text-gray-500'">{{ Math.floor(store.globalXP) }} XP</span>
      </div>
      <div class="w-full h-1.5 rounded-full overflow-hidden" 
           :class="store.isNightMode ? 'bg-gray-700' : 'bg-gray-300'" title="Global Level Progress">
        <div class="bg-gradient-to-r from-purple-600 to-blue-500 h-full transition-all duration-500" 
             :style="{ width: store.globalLevelProgress + '%' }"></div>
      </div>
    </div>

    <div class="p-3 border-b shrink-0 transition-colors"
         :class="store.isNightMode ? 'border-white/10 bg-black/20' : 'border-gray-200/50 bg-white/40'">
       <div class="rounded-2xl border p-2.5 transition-colors"
            :class="store.isNightMode ? 'border-emerald-900/40 bg-[#0d1511]' : 'border-emerald-200/80 bg-[#f3f8f1]'">
         <button
           @click="systemAppsExpanded = !systemAppsExpanded"
           class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.18em] transition-colors"
           :class="store.isNightMode ? 'text-emerald-200 hover:bg-white/5' : 'text-[#496148] hover:bg-black/5'"
         >
           <div class="text-left">
             <span>系统应用</span>
           </div>
           <span class="transition-transform" :class="systemAppsExpanded ? 'rotate-90' : ''">▶</span>
         </button>

         <div v-show="systemAppsExpanded" class="mt-2 space-y-1">
           <button @click="store.openShop()" :class="navBtnClass('shop', 'text-yellow-500', 'bg-yellow-700', 'text-yellow-700', 'bg-yellow-100')">
             <span class="text-xl">🏪</span><span>商店</span>
           </button>
           <button @click="store.openMap()" :class="navBtnClass('map', 'text-amber-500', 'bg-amber-900', 'text-amber-700', 'bg-amber-100')">
             <span class="text-xl">🗺️</span><span>密涅瓦</span>
           </button>
           <button @click="store.openNotebook()" :class="navBtnClass('notebook', 'text-blue-500', 'bg-blue-800', 'text-blue-700', 'bg-blue-100')">
             <span class="text-xl">📝</span><span>巡林官手记</span>
           </button>
         </div>
       </div>
    </div>

    <div class="px-4 py-2 text-xs font-bold uppercase tracking-widest mt-2 flex justify-between items-center"
         :class="store.isNightMode ? 'text-green-200/60' : 'text-[#6d7d58]'">
      <span>技能与行动</span>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2 custom-scrollbar overflow-x-visible">
      <div v-if="groupedProjects.length === 0" class="p-4 text-center text-sm mt-4"
           :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
        <p>暂无技能与行动</p>
      </div>

      <div v-for="group in groupedProjects" :key="group.id || 'unclassified'" class="mb-2">
         
         <div class="px-3 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors group rounded-md"
              :class="[
                store.isNightMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-black/5',
                dragOverThemeId === group.id ? (store.isNightMode ? 'bg-blue-900/30 border border-blue-500/50' : 'bg-blue-50 border border-blue-300') : 'border border-transparent'
              ]"
              @click="toggleTheme(group.id)"
              @dragover.prevent="dragOverThemeId = group.id"
              @dragleave.prevent="dragOverThemeId = null"
              @drop="handleDropOnTheme(group.id, $event)">
            <div class="flex items-center gap-2">
               <span class="transition-transform inline-block" :class="expandedThemes.has(group.id) ? 'rotate-90' : ''">▶</span>
               
               <div v-if="editingThemeId === group.id" @click.stop>
                  <input ref="renameThemeInput" v-model="editThemeName"
                         @blur="confirmRenameTheme" @keyup.enter="confirmRenameTheme" @keyup.esc="cancelRenameTheme"
                         type="text" class="text-xs px-1 py-0.5 rounded outline-none border border-blue-500 bg-transparent"
                         :class="store.isNightMode ? 'text-white' : 'text-gray-900'" />
               </div>
               <span v-else>{{ group.name }}</span>
            </div>

            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button v-if="group.id && editingThemeId !== group.id" @click.stop="startRenameTheme(group)" class="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="重命名技能">✏️</button>
               <button v-if="group.id" @click.stop="handleDeleteTheme(group)" class="p-1 hover:bg-red-500/20 text-red-500 rounded" title="删除技能">🗑️</button>
               <span v-if="!group.id" class="text-[10px]">未归属技能</span>
            </div>
         </div>

         <div v-show="expandedThemes.has(group.id)" class="mt-1 space-y-1">
            <div v-if="group.projects.length === 0" class="text-center text-[10px] py-2 opacity-50" 
                 :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
                暂无行动
            </div>

            <div v-for="project in group.projects" :key="project.id"
                draggable="true" 
                @dragstart="handleDragStart(project, $event)"
                @dragend="resetDragState"
                @dragover.prevent="handleProjectDragOver(project, $event)"
                @drop="handleProjectDrop(project, $event)"
                @click="store.selectProject(project.id)"
                class="pb-1 relative transition-all z-10"
                :class="{
                  'z-50': activeMenuId === project.id,
                  'pt-3': dragOverProjectId === project.id && dragInsertPosition === 'before',
                  'pb-4': dragOverProjectId === project.id && dragInsertPosition === 'after'
                }">

              <div v-if="dragOverProjectId === project.id && dragInsertPosition === 'before'"
                   class="absolute left-3 right-3 top-0 h-0.5 rounded-full"
                   :class="store.isNightMode ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]'"></div>
              
              <div class="group/item w-full flex items-center p-2 rounded-md border-l-4 transition-all relative cursor-pointer backdrop-blur-sm pr-8"
                  :class="[
                    isActive(project.id) 
                      ? (store.isNightMode ? 'bg-[#353535] border-green-500' : 'bg-emerald-50 border-emerald-500 shadow-sm') 
                      : (store.isNightMode ? 'border-transparent hover:bg-[#2a2a2a]' : 'border-transparent hover:bg-white/60'),
                    dragOverProjectId === project.id ? (store.isNightMode ? 'ring-1 ring-amber-500/40' : 'ring-1 ring-amber-300') : ''
                  ]">
                  <div class="absolute left-1 opacity-0 group-hover/item:opacity-100 cursor-move text-xs mr-1"
                       :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'">⋮⋮</div>
                  
                  <div class="mr-3 ml-3 text-2xl transition-transform group-hover/item:scale-105 pointer-events-none">{{ project.icon }}</div>
                  
                  <div class="text-left flex-1 min-w-0">
                      <div v-if="editingId === project.id" class="mr-2" @click.stop>
                          <input ref="renameInput" v-model="editName"
                              @blur="confirmRename" @keyup.enter="confirmRename" @keyup.esc="cancelRename"
                              type="text" class="w-full text-sm px-1 py-0.5 rounded outline-none border border-blue-500 bg-transparent"
                              :class="store.isNightMode ? 'text-white' : 'text-gray-900'" />
                      </div>

                      <div v-else class="pointer-events-none">
                          <div class="font-bold text-sm truncate" 
                               :class="isActive(project.id) 
                                  ? (store.isNightMode ? 'text-white' : 'text-emerald-900') 
                                  : (store.isNightMode ? 'text-gray-400' : 'text-gray-600')">
                              {{ project.name }}
                          </div>
                          <div class="text-[10px] flex justify-between mt-1"
                               :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
                              <span>Lv. {{ project.level }}</span>
                              <span>{{ project.totalTrees }} 🌲</span>
                          </div>
                          <div class="w-full h-1 mt-1 rounded-full overflow-hidden"
                               :class="store.isNightMode ? 'bg-gray-700' : 'bg-gray-200'">
                              <div class="bg-blue-500 h-full transition-all" :style="{ width: (project.currentXP / project.nextLevelXP) * 100 + '%' }"></div>
                          </div>
                      </div>
                  </div>

                  <button @click.stop="toggleMenu(project.id)"
                          class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-all z-10"
                          :class="[
                             activeMenuId === project.id ? 'opacity-100 bg-black/10 dark:bg-white/10' : '',
                             store.isNightMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-800 hover:bg-black/5'
                          ]" title="More Options">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </button>

                  <div v-if="activeMenuId === project.id" 
                       class="absolute right-0 top-full mt-1 w-32 rounded-lg shadow-xl border z-50 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col py-1"
                       :class="store.isNightMode ? 'bg-[#252525] border-gray-700' : 'bg-white border-gray-200'"
                       @click.stop>
                      <button @click="startRename(project)" 
                              class="text-left px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t"
                              :class="store.isNightMode ? 'border-gray-700 text-blue-400' : 'border-gray-100 text-blue-600'">
                         <span>✏️</span> 重命名
                      </button>
                      <button @click="openMergeModal(project)"
                              class="text-left px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t"
                              :class="store.isNightMode ? 'border-gray-700 text-amber-400' : 'border-gray-100 text-amber-600'">
                         <span>🔀</span> 合并到...
                      </button>
                      <button @click="handleDelete(project)" 
                              class="text-left px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t"
                              :class="store.isNightMode ? 'text-red-400 border-gray-700' : 'text-red-600 border-gray-100'">
                         <span>🗑️</span> 删除
                      </button>
                  </div>
              </div>

              <div v-if="dragOverProjectId === project.id && dragInsertPosition === 'after'"
                   class="absolute left-3 right-3 bottom-1 h-0.5 rounded-full"
                   :class="store.isNightMode ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]'"></div>
            </div>
         </div>
      </div>
    </div>

    <div class="p-4 border-t shrink-0 flex flex-col gap-4 transition-colors"
         :class="store.isNightMode ? 'border-white/10 bg-black/20' : 'border-gray-200/50 bg-white/40'">
      
      <div v-if="createMode !== null" class="flex flex-col gap-2">
         <div class="text-xs font-bold mb-1 uppercase tracking-widest" :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
            {{ createMode === 'theme' ? '新建技能' : '新建行动' }}
         </div>
         <input v-model="newItemName" @keyup.enter="confirmCreate" ref="inputRef" type="text" :placeholder="createMode === 'theme' ? '输入技能名称' : '输入动词型行动，例如“审阅前端代码”'"
            class="w-full text-sm px-3 py-2 rounded border focus:border-green-500 outline-none transition-colors" 
            :class="store.isNightMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300 shadow-inner'"/>
         <div class="flex gap-2">
            <button @click="confirmCreate" class="flex-1 bg-green-700 hover:bg-green-600 text-white text-xs py-1.5 rounded font-bold">确认</button>
            <button @click="createMode = null" class="flex-1 text-white text-xs py-1.5 rounded transition-colors"
                    :class="store.isNightMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-500'">取消</button>
         </div>
      </div>
      
      <div v-else class="flex gap-2">
          <button @click="startCreating('project')" 
                  class="flex-1 flex items-center justify-center gap-1 py-2 rounded transition-colors text-xs font-bold border border-dashed"
                  :class="store.isNightMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-transparent' : 'bg-white/50 hover:bg-white text-gray-500 border-gray-300'">
            + 行动
          </button>
          <button @click="startCreating('theme')" 
                  class="flex-1 flex items-center justify-center gap-1 py-2 rounded transition-colors text-xs font-bold border border-dashed"
                  :class="store.isNightMode ? 'bg-[#333] hover:bg-[#444] text-blue-400 border-transparent' : 'bg-blue-50/50 hover:bg-blue-50 text-blue-600 border-blue-200'">
            + 技能
          </button>
      </div>

    </div>

    <div v-if="mergeSourceProject" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeMergeModal"></div>
      <div class="relative w-full max-w-md rounded-2xl border shadow-2xl p-6"
           :class="store.isNightMode ? 'bg-[#171717] border-gray-800' : 'bg-white border-gray-200'">
        <div class="flex justify-between items-start gap-4 mb-4">
          <div>
            <div class="text-xs font-bold uppercase tracking-widest mb-1"
                 :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
              Merge Action
            </div>
            <h3 class="text-xl font-bold" :class="store.isNightMode ? 'text-white' : 'text-gray-800'">
              合并行动
            </h3>
          </div>
          <button @click="closeMergeModal"
                  class="text-xs px-3 py-1 rounded-full border transition-colors"
                  :class="store.isNightMode ? 'border-gray-700 text-gray-400 hover:text-white' : 'border-gray-300 text-gray-500 hover:text-gray-800'">
            取消
          </button>
        </div>

        <div class="space-y-4">
          <div class="rounded-xl border p-4"
               :class="store.isNightMode ? 'border-amber-900/40 bg-amber-900/10' : 'border-amber-200 bg-amber-50'">
            <p class="text-sm font-semibold mb-2" :class="store.isNightMode ? 'text-amber-200' : 'text-amber-800'">
              将保留目标行动，并吸收源行动的数据
            </p>
            <p class="text-sm" :class="store.isNightMode ? 'text-amber-100/80' : 'text-amber-700'">
              源行动：{{ mergeSourceProject.name }}
            </p>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider"
                   :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
              目标行动
            </label>
            <select v-model="mergeTargetProjectId"
                    class="w-full rounded-xl px-4 py-3 border outline-none transition-colors"
                    :class="store.isNightMode ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-amber-500' : 'bg-white border-gray-300 text-gray-800 focus:border-amber-400'">
              <option v-for="project in mergeTargetOptions" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider"
                   :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
              Commit / 说明（可选）
            </label>
            <textarea
              v-model="mergeCommitMessage"
              placeholder="补充说明为什么要合并，系统日志会保留这条说明。"
              class="w-full rounded-xl px-4 py-3 border outline-none resize-none h-28 transition-colors"
              :class="store.isNightMode ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-amber-500 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 focus:border-amber-400 placeholder-gray-400'"
            ></textarea>
          </div>

          <div class="rounded-xl border p-4 text-sm"
               :class="store.isNightMode ? 'border-gray-800 bg-[#101010] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'">
            合并后会迁移源行动的树木、时长、经验和关联会话记录，并生成一条系统记录。
          </div>

          <button @click="confirmMergeProject"
                  :disabled="!mergeTargetProjectId"
                  class="w-full py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="store.isNightMode ? 'bg-amber-700 text-white hover:bg-amber-600' : 'bg-amber-500 text-white hover:bg-amber-400'">
            确认合并
          </button>
        </div>
      </div>
    </div>

    <div v-if="deleteTargetProject" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeDeleteModal"></div>
      <div class="relative w-full max-w-md rounded-2xl border shadow-2xl p-6"
           :class="store.isNightMode ? 'bg-[#171717] border-gray-800' : 'bg-white border-gray-200'">
        <div class="flex justify-between items-start gap-4 mb-4">
          <div>
            <div class="text-xs font-bold uppercase tracking-widest mb-1"
                 :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
              Delete Action
            </div>
            <h3 class="text-xl font-bold" :class="store.isNightMode ? 'text-white' : 'text-gray-800'">
              删除行动
            </h3>
          </div>
          <button @click="closeDeleteModal"
                  class="text-xs px-3 py-1 rounded-full border transition-colors"
                  :class="store.isNightMode ? 'border-gray-700 text-gray-400 hover:text-white' : 'border-gray-300 text-gray-500 hover:text-gray-800'">
            取消
          </button>
        </div>

        <div class="space-y-4">
          <div class="rounded-xl border p-4"
               :class="store.isNightMode ? 'border-red-900/40 bg-red-900/10' : 'border-red-200 bg-red-50'">
            <p class="text-sm font-semibold mb-2" :class="store.isNightMode ? 'text-red-200' : 'text-red-800'">
              删除后行动本体无法恢复
            </p>
            <p class="text-sm" :class="store.isNightMode ? 'text-red-100/80' : 'text-red-700'">
              目标行动：{{ deleteTargetProject.name }}
            </p>
          </div>

          <div class="rounded-xl border p-4 text-sm"
               :class="store.isNightMode ? 'border-gray-800 bg-[#101010] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'">
            系统会自动生成一条删除记录，保留行动名称、树木、时长、经验和关联会话数量。
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider"
                   :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'">
              Commit / 说明（可选）
            </label>
            <textarea
              v-model="deleteCommitMessage"
              placeholder="补充说明为什么要删除，系统日志会保留这条说明。"
              class="w-full rounded-xl px-4 py-3 border outline-none resize-none h-28 transition-colors"
              :class="store.isNightMode ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-red-500 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 focus:border-red-400 placeholder-gray-400'"
            ></textarea>
          </div>

          <button @click="confirmDeleteProject"
                  class="w-full py-3 rounded-xl font-bold transition-colors"
                  :class="store.isNightMode ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-red-500 text-white hover:bg-red-400'">
            确认删除
          </button>
        </div>
      </div>
    </div>

  </aside>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { alertDialog, confirmDialog } from '@/composables/dialogService'
import { useGameStore } from '@/stores/gameStore'

defineOptions({ name: 'SidebarPanel' })

const store = useGameStore()
const systemAppsExpanded = ref(true)

// === 🌟 分组数据渲染逻辑 ===
const groupedProjects = computed(() => {
    const groups = []
    store.themes.forEach(t => {
        groups.push({
            id: t.id,
            name: t.name,
            projects: store.projects.filter(p => p.themeId === t.id)
        })
    })
    const unclassified = store.projects.filter(p => !p.themeId)
    if (unclassified.length > 0 || groups.length === 0) {
        groups.unshift({
            id: null,
            name: '未归属技能',
            projects: unclassified
        })
    }
    return groups
})

const expandedThemes = ref(new Set([null])) // 默认展开未分类

const toggleTheme = (id) => {
    if (expandedThemes.value.has(id)) expandedThemes.value.delete(id)
    else expandedThemes.value.add(id)
}

// === 🌟 拖拽归类逻辑 ===
const dragOverThemeId = ref(null)
const dragOverProjectId = ref(null)
const dragInsertPosition = ref('before')
const draggedProjectId = ref(null)

const resetDragState = () => {
    dragOverThemeId.value = null
    dragOverProjectId.value = null
    dragInsertPosition.value = 'before'
    draggedProjectId.value = null
}

const handleDragStart = (project, event) => {
    draggedProjectId.value = project.id
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('projectId', project.id)
}

const handleDropOnTheme = (themeId, event) => {
    const projectId = event.dataTransfer.getData('projectId')
    if (projectId) {
        store.moveProjectToTheme(projectId, themeId)
    }
    resetDragState()
}

const handleProjectDragOver = (project, event) => {
    if (!draggedProjectId.value || draggedProjectId.value === project.id) return

    dragOverThemeId.value = null
    dragOverProjectId.value = project.id

    const bounds = event.currentTarget.getBoundingClientRect()
    const midpoint = bounds.top + bounds.height / 2
    dragInsertPosition.value = event.clientY < midpoint ? 'before' : 'after'
}

const handleProjectDrop = (project, event) => {
    const projectId = event.dataTransfer.getData('projectId')
    if (projectId && projectId !== project.id) {
        store.reorderProjects(projectId, project.id, dragInsertPosition.value)
    }
    resetDragState()
}

// === 项目/主题创建逻辑 ===
const createMode = ref(null) 
const newItemName = ref('')
const inputRef = ref(null)

const startCreating = (mode) => {
    createMode.value = mode
    newItemName.value = ''
    nextTick(() => inputRef.value?.focus())
}

const confirmCreate = () => {
    if (!newItemName.value.trim()) return
    if (createMode.value === 'theme') {
        store.createTheme(newItemName.value)
    } else if (createMode.value === 'project') {
        let targetThemeId = null
        if (expandedThemes.value.size === 1) {
             const onlyId = Array.from(expandedThemes.value)[0]
             targetThemeId = onlyId
        }
        store.createProject(newItemName.value, targetThemeId)
    }
    createMode.value = null
}

// === 项目重命名与删除逻辑 (保留原有) ===
const activeMenuId = ref(null)
const editingId = ref(null)
const editName = ref('')
const renameInput = ref(null)

const closeMenu = () => { activeMenuId.value = null }
onMounted(() => document.addEventListener('click', closeMenu))
onUnmounted(() => document.removeEventListener('click', closeMenu))

const toggleMenu = (id) => { activeMenuId.value = activeMenuId.value === id ? null : id }

const startRename = (project) => {
    editingId.value = project.id; editName.value = project.name; activeMenuId.value = null 
    nextTick(() => {
        if (renameInput.value && renameInput.value.length > 0) {
           const input = renameInput.value.find(el => el && el.offsetParent !== null)
           if (input) input.focus()
        }
    })
}

const confirmRename = () => {
    if (editingId.value && editName.value.trim()) store.renameProject(editingId.value, editName.value)
    cancelRename()
}
const cancelRename = () => { editingId.value = null; editName.value = '' }

const handleDelete = (project) => {
    activeMenuId.value = null
    deleteTargetProject.value = project
}

const mergeSourceProject = ref(null)
const mergeTargetProjectId = ref(null)
const mergeCommitMessage = ref('')
const deleteTargetProject = ref(null)
const deleteCommitMessage = ref('')

const mergeTargetOptions = computed(() => {
    if (!mergeSourceProject.value) return []
    return store.projects.filter(project => project.id !== mergeSourceProject.value.id)
})

const openMergeModal = (project) => {
    activeMenuId.value = null
    if (store.projects.length < 2) {
        void alertDialog('至少需要两个行动才能执行合并', {
            title: '无法合并'
        })
        return
    }
    mergeSourceProject.value = project
    mergeTargetProjectId.value = mergeTargetOptions.value[0]?.id || null
    mergeCommitMessage.value = ''
}

const closeMergeModal = () => {
    mergeSourceProject.value = null
    mergeTargetProjectId.value = null
    mergeCommitMessage.value = ''
}

const confirmMergeProject = async () => {
    if (!mergeSourceProject.value || !mergeTargetProjectId.value) return
    const target = store.projects.find(project => project.id === mergeTargetProjectId.value)
    if (!target) return

    const confirmed = await confirmDialog(
        `确认将行动 "${mergeSourceProject.value.name}" 合并到 "${target.name}" 吗？\n` +
        '合并后源行动会被移除，并生成系统记录。',
        {
            title: '确认行动合并',
            confirmText: '开始合并'
        }
    )

    if (!confirmed) return

    store.mergeProjects(mergeSourceProject.value.id, mergeTargetProjectId.value, {
        commitMessage: mergeCommitMessage.value
    })
    closeMergeModal()
}

const closeDeleteModal = () => {
    deleteTargetProject.value = null
    deleteCommitMessage.value = ''
}

const confirmDeleteProject = () => {
    if (!deleteTargetProject.value) return
    store.deleteProject(deleteTargetProject.value.id, {
        commitMessage: deleteCommitMessage.value
    })
    closeDeleteModal()
}

// === 🌟 主题重命名与删除逻辑 ===
const editingThemeId = ref(null)
const editThemeName = ref('')
const renameThemeInput = ref(null)

const startRenameTheme = (theme) => {
    editingThemeId.value = theme.id; editThemeName.value = theme.name
    nextTick(() => {
        if (renameThemeInput.value && renameThemeInput.value.length > 0) {
           const input = renameThemeInput.value.find(el => el && el.offsetParent !== null)
           if (input) input.focus()
        }
    })
}

const confirmRenameTheme = () => {
    if (editingThemeId.value && editThemeName.value.trim()) store.renameTheme(editingThemeId.value, editThemeName.value)
    cancelRenameTheme()
}
const cancelRenameTheme = () => { editingThemeId.value = null; editThemeName.value = '' }

const handleDeleteTheme = async (theme) => {
    const confirmed = await confirmDialog(
        `确定要删除技能 "${theme.name}" 吗？\n其下的行动将会被移回“未归属技能”。`,
        {
            title: '删除技能',
            confirmText: '删除'
        }
    )
    if (confirmed) store.deleteTheme(theme.id)
}

// === 样式辅助 ===
const navBtnClass = (view, nightText, nightBg, dayText, dayBg) => {
    const isActive = store.activeView === view
    const isNight = store.isNightMode
    const base = 'w-full flex items-center gap-3 p-3 rounded-md transition-all font-bold uppercase tracking-wide text-sm'
    return isActive ? [base, isNight ? `${nightBg} text-white` : `${dayBg} ${dayText} shadow-md ring-1 ring-black/5`]
                    : [base, isNight ? `bg-[#333] ${nightText} hover:bg-[#3a3a3a]` : `bg-white/50 text-gray-500 hover:bg-white/80`]
}

const isActive = (id) => store.activeProjectId === id && store.activeView === 'dashboard'
</script>
