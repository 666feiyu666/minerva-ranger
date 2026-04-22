<template>
  <div class="flex-1 p-6 flex flex-col h-full overflow-hidden bg-transparent relative">
    <div
      class="rounded-2xl p-6 mb-4 shadow-lg shrink-0 border backdrop-blur-md transition-all duration-300"
      :class="
        store.isNightMode
          ? 'bg-[#1a1a1a]/80 border-gray-700'
          : 'bg-white/70 border-white/60 shadow-xl ring-1 ring-black/5'
      "
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div
              class="text-xs uppercase tracking-widest mb-1 font-bold"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              Knowledge Base
            </div>
            <h2
              class="text-3xl font-bold tracking-wide"
              :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
            >
              巡林官手记
            </h2>
          </div>

          <div
            class="flex gap-2 p-1 rounded-lg border transition-colors w-full lg:w-auto"
            :class="
              store.isNightMode
                ? 'bg-[#0f0f0f] border-gray-700'
                : 'bg-gray-200/50 border-gray-300'
            "
          >
            <button
              @click="currentTab = 'planting'"
              class="flex-1 lg:flex-none px-4 py-2 rounded-md font-mono text-sm font-bold transition-all border border-transparent"
              :class="
                currentTab === 'planting'
                  ? 'bg-[#0a0a0a] text-green-400 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                  : store.isNightMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              "
            >
              >_ 植树日志
            </button>
            <button
              @click="currentTab = 'system'"
              class="flex-1 lg:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all border border-transparent"
              :class="
                currentTab === 'system'
                  ? store.isNightMode
                    ? 'bg-amber-900/40 text-amber-200 border-amber-700 shadow-sm'
                    : 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm'
                  : store.isNightMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              "
            >
              系统日志
            </button>
            <button
              @click="currentTab = 'ranger'"
              class="flex-1 lg:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all border border-transparent"
              :class="
                currentTab === 'ranger'
                  ? store.isNightMode
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-800 shadow-sm'
                  : store.isNightMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              "
            >
              巡林日志（预留）
            </button>
          </div>
        </div>

        <div v-if="currentTab !== 'system'" class="grid gap-4 lg:grid-cols-[1.2fr_1.8fr]">
          <section
            class="rounded-2xl p-4 border"
            :class="
              store.isNightMode
                ? 'bg-[#121212] border-gray-800'
                : 'bg-white/60 border-gray-200'
            "
          >
            <div class="flex items-center justify-between gap-3 mb-3">
              <div>
                <div
                  class="text-xs font-bold uppercase tracking-wider"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  Filter by Theme
                </div>
                <div
                  class="text-sm mt-1"
                  :class="store.isNightMode ? 'text-gray-300' : 'text-gray-600'"
                >
                  先选主题，再缩小到具体项目
                </div>
              </div>
              <span
                class="text-xs px-2 py-1 rounded-full border"
                :class="
                  store.isNightMode
                    ? 'text-emerald-300 border-emerald-900 bg-emerald-900/20'
                    : 'text-emerald-700 border-emerald-200 bg-emerald-50'
                "
              >
                {{ themeOptions.length }} 个分组
              </span>
            </div>

            <div class="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <button
                v-for="theme in themeOptions"
                :key="theme.id"
                @click="selectedThemeId = theme.id"
                class="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                :class="themeButtonClass(theme.id)"
              >
                {{ theme.label }}
              </button>
            </div>
          </section>

          <section
            class="rounded-2xl p-4 border"
            :class="
              store.isNightMode
                ? 'bg-[#121212] border-gray-800'
                : 'bg-white/60 border-gray-200'
            "
          >
            <div class="flex items-center justify-between gap-3 mb-3">
              <div>
                <div
                  class="text-xs font-bold uppercase tracking-wider"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  Filter by Project
                </div>
                <div
                  class="text-sm mt-1"
                  :class="store.isNightMode ? 'text-gray-300' : 'text-gray-600'"
                >
                  {{
                    selectedThemeId === 'all'
                      ? '当前展示所有主题下的项目'
                      : '当前仅展示所选主题下的项目'
                  }}
                </div>
              </div>
              <span
                class="text-xs px-2 py-1 rounded-full border"
                :class="
                  store.isNightMode
                    ? 'text-blue-300 border-blue-900 bg-blue-900/20'
                    : 'text-blue-700 border-blue-200 bg-blue-50'
                "
              >
                {{ projectOptions.length - 1 }} 个项目
              </span>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="project in projectOptions"
                :key="project.id"
                @click="selectedProjectId = project.id"
                class="px-4 py-2 rounded-full text-sm font-bold transition-all border shadow-sm flex items-center gap-1.5 hover:-translate-y-0.5"
                :class="projectButtonClass(project.id)"
              >
                <span v-if="project.icon">{{ project.icon }}</span>
                {{ project.label }}
              </button>
            </div>

            <p
              v-if="projectOptions.length === 1"
              class="text-sm mt-3"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              当前主题下还没有项目，可以先在侧边栏创建项目。
            </p>
          </section>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-24">
      <template v-if="currentTab === 'planting'">
        <div
          v-if="plantingLogs.length === 0"
          class="text-center mt-20 max-w-lg mx-auto rounded-2xl border p-8"
          :class="
            store.isNightMode
              ? 'bg-[#101010]/80 border-gray-800 text-gray-500'
              : 'bg-white/70 border-gray-200 text-gray-400'
          "
        >
          <p class="text-4xl mb-4">🌱</p>
          <p class="font-semibold mb-2">当前筛选条件下还没有记录</p>
          <p class="text-sm">
            可以切换主题或项目筛选，或者完成一次新的植树记录。
          </p>
        </div>

        <article
          v-for="note in plantingLogs"
          :key="note.id"
          class="rounded-2xl border shadow-sm transition-all overflow-hidden"
          :class="noteCardClass(note)"
        >
          <template v-if="editingNoteId === note.id">
            <div class="p-5 space-y-4">
              <div class="flex justify-between items-start gap-4">
                <div>
                  <div
                    class="text-xs uppercase tracking-widest font-bold mb-1"
                    :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                  >
                    Editing Note
                  </div>
                  <h3
                    class="text-lg font-bold"
                    :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
                  >
                    编辑植树日志
                  </h3>
                </div>
                <button
                  @click="cancelEditing"
                  class="text-xs px-3 py-1 rounded-full border transition-colors"
                  :class="
                    store.isNightMode
                      ? 'border-gray-700 text-gray-400 hover:text-white'
                      : 'border-gray-300 text-gray-500 hover:text-gray-800'
                  "
                >
                  取消
                </button>
              </div>

              <div class="grid gap-4 lg:grid-cols-[1fr_220px]">
                <div class="space-y-3">
                  <div class="space-y-1">
                    <label
                      class="text-xs font-bold uppercase tracking-wider"
                      :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                    >
                      Title
                    </label>
                    <input
                      v-model="editDraft.title"
                      type="text"
                      class="w-full rounded-xl px-4 py-3 border outline-none transition-colors"
                      :class="
                        store.isNightMode
                          ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-emerald-500'
                          : 'bg-white border-gray-300 text-gray-800 focus:border-emerald-400'
                      "
                    />
                  </div>

                  <div class="space-y-1">
                    <label
                      class="text-xs font-bold uppercase tracking-wider"
                      :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                    >
                      Content
                    </label>
                    <textarea
                      v-model="editDraft.content"
                      class="w-full h-36 rounded-xl px-4 py-3 border outline-none resize-none transition-colors"
                      :class="
                        store.isNightMode
                          ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-emerald-500'
                          : 'bg-white border-gray-300 text-gray-800 focus:border-emerald-400'
                      "
                    ></textarea>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="space-y-1">
                    <label
                      class="text-xs font-bold uppercase tracking-wider"
                      :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                    >
                      Project
                    </label>
                    <select
                      v-model="editDraft.projectId"
                      class="w-full rounded-xl px-4 py-3 border outline-none transition-colors"
                      :class="
                        store.isNightMode
                          ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-emerald-500'
                          : 'bg-white border-gray-300 text-gray-800 focus:border-emerald-400'
                      "
                    >
                      <option
                        v-for="project in editableProjectOptions"
                        :key="project.id"
                        :value="project.id"
                      >
                        {{ project.label }}
                      </option>
                    </select>
                  </div>

                  <div
                    class="rounded-xl border p-3 text-sm"
                    :class="
                      store.isNightMode
                        ? 'border-gray-800 bg-[#0c0c0c] text-gray-400'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    "
                  >
                    编辑日志不会重复发金币，也不会重新结算树木或经验。
                  </div>

                  <button
                    @click="saveEditing(note.id)"
                    class="w-full py-3 rounded-xl font-bold transition-colors"
                    :class="
                      store.isNightMode
                        ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    "
                  >
                    保存修改
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="p-5">
              <div class="flex justify-between items-start gap-4 mb-4">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      class="text-[11px] px-2 py-1 rounded-full border font-bold uppercase tracking-wide"
                      :class="noteBadgeClass(note)"
                    >
                      {{ note.source === 'system' ? 'System Log' : 'Planting Log' }}
                    </span>
                    <span
                      v-if="note.eventType === 'project_merge'"
                      class="text-[11px] px-2 py-1 rounded-full border font-bold uppercase tracking-wide"
                      :class="
                        store.isNightMode
                          ? 'text-amber-300 border-amber-900 bg-amber-900/20'
                          : 'text-amber-700 border-amber-200 bg-amber-50'
                      "
                    >
                      Project Merge
                    </span>
                  </div>
                  <h3
                    class="font-bold text-lg break-words"
                    :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
                  >
                    {{ note.title }}
                  </h3>
                </div>

                <div class="flex items-start gap-2 shrink-0">
                  <span
                    class="text-xs mt-1"
                    :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                  >
                    {{ note.date }}
                  </span>
                  <button
                    v-if="note.source !== 'system'"
                    @click="startEditing(note)"
                    class="text-xs px-3 py-1 rounded-full border transition-colors"
                    :class="
                      store.isNightMode
                        ? 'border-gray-700 text-blue-300 hover:text-white'
                        : 'border-blue-200 text-blue-600 hover:text-blue-700'
                    "
                  >
                    编辑
                  </button>
                  <button
                    v-if="note.source !== 'system'"
                    @click="store.deleteNote(note.id)"
                    class="text-xs px-3 py-1 rounded-full border transition-colors"
                    :class="
                      store.isNightMode
                        ? 'border-gray-700 text-red-300 hover:text-white'
                        : 'border-red-200 text-red-500 hover:text-red-600'
                    "
                  >
                    删除
                  </button>
                </div>
              </div>

              <div
                class="text-sm whitespace-pre-wrap leading-relaxed"
                :class="
                  note.source === 'system'
                    ? store.isNightMode
                      ? 'text-amber-100'
                      : 'text-amber-900'
                    : store.isNightMode
                      ? 'text-gray-300'
                      : 'text-gray-600'
                "
              >
                {{ note.content || '> [NO_TEXT_DATA_PROVIDED]' }}
              </div>

              <div class="mt-4 flex flex-wrap gap-2 text-xs">
                <span
                  class="px-2 py-1 rounded-full border"
                  :class="
                    store.isNightMode
                      ? 'border-gray-700 text-gray-400 bg-black/20'
                      : 'border-gray-200 text-gray-500 bg-gray-50'
                  "
                >
                  字数 {{ note.wordCount }}
                </span>
                <span
                  class="px-2 py-1 rounded-full border"
                  :class="
                    store.isNightMode
                      ? 'border-gray-700 text-gray-400 bg-black/20'
                      : 'border-gray-200 text-gray-500 bg-gray-50'
                  "
                >
                  金币 +{{ note.coins }}
                </span>
                <span
                  v-if="note.projectIds?.length"
                  class="px-2 py-1 rounded-full border"
                  :class="
                    store.isNightMode
                      ? 'border-blue-900 text-blue-300 bg-blue-900/20'
                      : 'border-blue-200 text-blue-700 bg-blue-50'
                  "
                >
                  {{ getProjectNames(note.projectIds) }}
                </span>
              </div>
            </div>
          </template>
        </article>
      </template>

      <template v-else-if="currentTab === 'system'">
        <div
          v-if="systemLogs.length === 0"
          class="text-center mt-20 max-w-lg mx-auto rounded-2xl border p-8"
          :class="
            store.isNightMode
              ? 'bg-[#101010]/80 border-gray-800 text-gray-500'
              : 'bg-white/70 border-gray-200 text-gray-400'
          "
        >
          <p class="text-4xl mb-4">📜</p>
          <p class="font-semibold mb-2">当前还没有系统事件记录</p>
          <p class="text-sm">
            未来这里会持续沉淀项目合并、关键操作和更多系统事件。
          </p>
        </div>

        <article
          v-for="note in systemLogs"
          :key="note.id"
          class="rounded-2xl border shadow-sm transition-all overflow-hidden"
          :class="noteCardClass(note)"
        >
          <div class="p-5">
            <div class="flex justify-between items-start gap-4 mb-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    class="text-[11px] px-2 py-1 rounded-full border font-bold uppercase tracking-wide"
                    :class="noteBadgeClass(note)"
                  >
                    System Log
                  </span>
                  <span
                    v-if="note.eventType === 'project_merge'"
                    class="text-[11px] px-2 py-1 rounded-full border font-bold uppercase tracking-wide"
                    :class="
                      store.isNightMode
                        ? 'text-amber-300 border-amber-900 bg-amber-900/20'
                        : 'text-amber-700 border-amber-200 bg-amber-50'
                    "
                  >
                    Project Merge
                  </span>
                </div>
                <h3
                  class="font-bold text-lg break-words"
                  :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
                >
                  {{ note.title }}
                </h3>
              </div>

              <span
                class="text-xs mt-1 shrink-0"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                {{ note.date }}
              </span>
            </div>

            <div
              class="text-sm whitespace-pre-wrap leading-relaxed"
              :class="
                store.isNightMode ? 'text-amber-100' : 'text-amber-900'
              "
            >
              {{ note.content || '> [NO_SYSTEM_TEXT_PROVIDED]' }}
            </div>

            <div class="mt-4 flex flex-wrap gap-2 text-xs">
              <span
                v-if="note.projectIds?.length"
                class="px-2 py-1 rounded-full border"
                :class="
                  store.isNightMode
                    ? 'border-blue-900 text-blue-300 bg-blue-900/20'
                    : 'border-blue-200 text-blue-700 bg-blue-50'
                "
              >
                {{ getProjectNames(note.projectIds) }}
              </span>
              <span
                class="px-2 py-1 rounded-full border"
                :class="
                  store.isNightMode
                    ? 'border-gray-700 text-gray-400 bg-black/20'
                    : 'border-gray-200 text-gray-500 bg-gray-50'
                "
              >
                系统生成，只读
              </span>
            </div>
          </div>
        </article>
      </template>

      <template v-else>
        <div
          class="rounded-2xl border p-6"
          :class="
            store.isNightMode
              ? 'bg-[#101010]/80 border-gray-800'
              : 'bg-white/70 border-gray-200'
          "
        >
          <div class="flex items-center justify-between gap-4 mb-4">
            <div>
              <div
                class="text-xs uppercase tracking-widest font-bold mb-1"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                Reserved Feature
              </div>
              <h3
                class="text-xl font-bold"
                :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
              >
                巡林日志暂未开放编辑与录入
              </h3>
            </div>
            <span
              class="px-3 py-1 rounded-full border text-xs font-bold"
              :class="
                store.isNightMode
                  ? 'text-amber-300 border-amber-900 bg-amber-900/20'
                  : 'text-amber-700 border-amber-200 bg-amber-50'
              "
            >
              Future Expansion
            </span>
          </div>

          <p
            class="text-sm mb-6"
            :class="store.isNightMode ? 'text-gray-400' : 'text-gray-600'"
          >
            这个区域目前只保留结构与筛选能力，后续再扩展完整的巡林日志工作流。
          </p>

          <div
            v-if="rangerLogs.length === 0"
            class="rounded-2xl border border-dashed p-8 text-center"
            :class="
              store.isNightMode
                ? 'border-gray-800 text-gray-500'
                : 'border-gray-200 text-gray-400'
            "
          >
            当前没有巡林日志记录。
          </div>

          <div v-else class="space-y-3">
            <article
              v-for="note in rangerLogs"
              :key="note.id"
              class="rounded-2xl border p-5"
              :class="
                store.isNightMode
                  ? 'bg-[#181818] border-gray-800'
                  : 'bg-white border-gray-200'
              "
            >
              <div class="flex justify-between gap-4 mb-3">
                <h4
                  class="font-bold"
                  :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
                >
                  {{ note.title }}
                </h4>
                <span
                  class="text-xs"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  {{ note.date }}
                </span>
              </div>
              <p
                class="text-sm whitespace-pre-wrap"
                :class="store.isNightMode ? 'text-gray-300' : 'text-gray-600'"
              >
                {{ note.content }}
              </p>
            </article>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const UNCATEGORIZED_THEME_ID = '__uncategorized__'

const store = useGameStore()

const currentTab = ref('planting')
const selectedThemeId = ref('all')
const selectedProjectId = ref('all')
const editingNoteId = ref(null)
const editDraft = reactive({
  title: '',
  content: '',
  projectId: 'all'
})

const uncategorizedCount = computed(
  () => store.projects.filter(project => !project.themeId).length
)

const themeOptions = computed(() => {
  const options = [{ id: 'all', label: '所有主题' }]
  store.themes.forEach(theme => {
    options.push({ id: theme.id, label: theme.name })
  })
  if (uncategorizedCount.value > 0) {
    options.push({ id: UNCATEGORIZED_THEME_ID, label: '未分类' })
  }
  return options
})

const filteredProjects = computed(() => {
  if (selectedThemeId.value === 'all') return store.projects
  if (selectedThemeId.value === UNCATEGORIZED_THEME_ID) {
    return store.projects.filter(project => !project.themeId)
  }
  return store.projects.filter(project => project.themeId === selectedThemeId.value)
})

const projectOptions = computed(() => [
  { id: 'all', label: '所有项目', icon: '🌟' },
  ...filteredProjects.value.map(project => ({
    id: project.id,
    label: project.name,
    icon: project.icon || '📁'
  }))
])

const editableProjectOptions = computed(() =>
  store.projects.map(project => ({
    id: project.id,
    label: project.name
  }))
)

watch(projectOptions, options => {
  if (!options.some(option => option.id === selectedProjectId.value)) {
    selectedProjectId.value = 'all'
  }
})

const matchesTheme = note => {
  if (selectedThemeId.value === 'all') return true
  if (!note.projectIds?.length) return false

  return note.projectIds.some(projectId => {
    const project = store.projects.find(item => item.id === projectId)
    if (!project) return false
    if (selectedThemeId.value === UNCATEGORIZED_THEME_ID) return !project.themeId
    return project.themeId === selectedThemeId.value
  })
}

const matchesProject = note => {
  if (selectedProjectId.value === 'all') return true
  return note.projectIds?.includes(selectedProjectId.value)
}

const visibleNotes = computed(() =>
  store.notebook.filter(note => matchesTheme(note) && matchesProject(note))
)

const plantingLogs = computed(() =>
  visibleNotes.value.filter(note => note.type === 'planting')
)

const systemLogs = computed(() =>
  visibleNotes.value.filter(note => note.type === 'system')
)

const rangerLogs = computed(() =>
  visibleNotes.value.filter(note => note.type === 'ranger')
)

const getProjectNames = ids => {
  if (!ids || ids.length === 0) return '未分类'
  return ids
    .map(id => {
      const project = store.projects.find(projectItem => projectItem.id === id)
      return project ? project.name : '未知项目'
    })
    .join(', ')
}

const themeButtonClass = themeId => {
  if (selectedThemeId.value === themeId) {
    return store.isNightMode
      ? 'bg-emerald-900/40 border-emerald-700 text-emerald-300'
      : 'bg-emerald-100 border-emerald-300 text-emerald-800'
  }
  return store.isNightMode
    ? 'bg-[#1d1d1d] border-gray-700 text-gray-400 hover:text-gray-200'
    : 'bg-white border-gray-300 text-gray-600 hover:text-gray-800'
}

const projectButtonClass = projectId => {
  if (selectedProjectId.value === projectId) {
    return store.isNightMode
      ? 'bg-blue-900/40 text-blue-200 border-blue-700'
      : 'bg-blue-100 text-blue-700 border-blue-300'
  }
  return store.isNightMode
    ? 'bg-[#1d1d1d] text-gray-400 border-gray-700 hover:text-gray-200'
    : 'bg-white text-gray-600 border-gray-300 hover:text-gray-800'
}

const noteCardClass = note => {
  if (note.source === 'system') {
    return store.isNightMode
      ? 'bg-[#17110a] border-amber-900/60'
      : 'bg-amber-50/80 border-amber-200'
  }
  return store.isNightMode
    ? 'bg-[#151515] border-gray-800 hover:border-gray-700'
    : 'bg-white/80 border-gray-200 hover:border-emerald-200'
}

const noteBadgeClass = note => {
  if (note.source === 'system') {
    return store.isNightMode
      ? 'text-amber-300 border-amber-900 bg-amber-900/20'
      : 'text-amber-700 border-amber-200 bg-amber-50'
  }
  return store.isNightMode
    ? 'text-green-300 border-green-900 bg-green-900/20'
    : 'text-green-700 border-green-200 bg-green-50'
}

const startEditing = note => {
  editingNoteId.value = note.id
  editDraft.title = note.title
  editDraft.content = note.content
  editDraft.projectId = note.projectIds?.[0] || editableProjectOptions.value[0]?.id || 'all'
}

const cancelEditing = () => {
  editingNoteId.value = null
  editDraft.title = ''
  editDraft.content = ''
  editDraft.projectId = 'all'
}

const saveEditing = noteId => {
  const updated = store.updateNote(noteId, {
    title: editDraft.title,
    content: editDraft.content,
    projectIds: editDraft.projectId === 'all' ? [] : [editDraft.projectId]
  })

  if (updated) cancelEditing()
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
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
