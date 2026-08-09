<template>
  <section
    class="rounded-[2rem] border shadow-xl overflow-hidden"
    :class="isNightMode ? 'bg-[#121613] border-[#33463a] text-white' : 'bg-[#fbfaf5] border-[#ddd8cc] text-gray-800'"
  >
    <template v-if="selectedAction">
      <div class="border-b px-6 py-5" :class="isNightMode ? 'border-white/10' : 'border-[#e5dfd1]'">
        <button class="text-xs font-bold opacity-70 hover:opacity-100" @click="selectedActionId = null">
          ← 返回行动档案
        </button>
        <div class="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div class="text-xs font-bold uppercase tracking-widest opacity-50">
              {{ skillName(selectedAction.skillId) }}
            </div>
            <h3 class="mt-2 text-2xl font-black">{{ selectedAction.name }}</h3>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div class="stat">Lv. {{ selectedAction.level }}</div>
            <div class="stat">{{ selectedAction.totalTrees }} 棵</div>
            <div class="stat">{{ selectedPlantingNotes.length }} 记录</div>
            <div class="stat">{{ selectedEssayNotes.length }} 随笔</div>
          </div>
        </div>
        <input
          v-model="searchQuery"
          class="mt-4 w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:border-emerald-500"
          :class="isNightMode ? 'border-white/10' : 'border-[#ddd8cc] bg-white/80'"
          placeholder="搜索当前行动的备注、快照或树种"
        />
      </div>
      <div class="space-y-8 p-6">
        <div>
          <div class="mb-4 flex items-center justify-between">
            <h4 class="text-xl font-black">植树记录</h4>
            <span class="text-xs opacity-60">{{ selectedPlantingNotes.length }} 条</span>
          </div>
          <div v-if="selectedPlantingNotes.length" class="space-y-4">
            <PlantingRecordCard
              v-for="note in selectedPlantingNotes"
              :key="note.id"
              :note="note"
              :actions="actions"
              :skills="skills"
              :is-night-mode="isNightMode"
            />
          </div>
          <div v-else class="empty">这个行动还没有植树记录。</div>
        </div>

        <div>
          <div class="mb-4 flex items-center justify-between">
            <h4 class="text-xl font-black">关联随笔</h4>
            <button class="rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white" @click="$emit('create-essay', selectedAction.id)">
              + 写一篇随笔
            </button>
          </div>
          <div v-if="selectedEssayNotes.length" class="grid gap-4 xl:grid-cols-2">
            <button
              v-for="note in selectedEssayNotes"
              :key="note.id"
              class="rounded-2xl border p-5 text-left hover:-translate-y-0.5 transition-all"
              :class="isNightMode ? 'border-sky-900/40 bg-[#181421]' : 'border-sky-200 bg-sky-50/70'"
              @click="$emit('open-essay', note.id)"
            >
              <div class="text-xs font-bold text-sky-600">巡林随笔</div>
              <h5 class="mt-2 text-lg font-black">{{ note.title }}</h5>
              <p class="mt-3 line-clamp-3 text-sm opacity-70">{{ preview(note.content) }}</p>
            </button>
          </div>
          <div v-else class="empty">这个行动还没有关联随笔。</div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="border-b px-6 py-5" :class="isNightMode ? 'border-white/10' : 'border-[#e5dfd1]'">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in skillOptions"
            :key="option.id"
            class="rounded-full border px-4 py-2 text-sm font-bold"
            :class="tabClass(option.id)"
            @click="selectedSkillId = option.id"
          >
            {{ option.label }} <span class="ml-1 opacity-60">{{ option.count }}</span>
          </button>
        </div>
        <input
          v-model="searchQuery"
          class="mt-4 w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:border-emerald-500"
          :class="isNightMode ? 'border-white/10' : 'border-[#ddd8cc] bg-white/80'"
          placeholder="搜索历史记录的备注、行动、技能或树种"
        />
      </div>

      <div class="p-6">
        <h3 class="text-xl font-black">当前行动</h3>
        <div v-if="filteredActions.length" class="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <button
            v-for="action in filteredActions"
            :key="action.id"
            class="rounded-2xl border p-5 text-left transition-all hover:-translate-y-1"
            :class="isNightMode ? 'border-white/10 bg-black/20' : 'border-[#e5dfd1] bg-white/85'"
            @click="selectedActionId = action.id"
          >
            <div class="text-xs font-bold uppercase opacity-50">{{ skillName(action.skillId) }}</div>
            <h4 class="mt-2 text-xl font-black">{{ action.name }}</h4>
            <div class="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <span class="stat">Lv. {{ action.level }}</span>
              <span class="stat">{{ action.totalTrees }} 棵</span>
              <span class="stat">{{ noteCount(action.id) }} 记录</span>
              <span class="stat">{{ formatDuration(action.totalTimeSpent) }}</span>
            </div>
          </button>
        </div>
        <div v-else class="empty mt-4">当前分类下没有行动。</div>

        <div class="mt-10 flex items-end justify-between gap-4">
          <div>
            <h3 class="text-xl font-black">历史与未分类记录</h3>
            <p class="mt-2 text-sm opacity-60">行动删除后，记录会降级到技能；技能删除后进入未分类。</p>
          </div>
          <span class="text-xs opacity-60">{{ orphanNotes.length }} 条</span>
        </div>
        <div v-if="orphanNotes.length" class="mt-4 space-y-4">
          <template v-for="note in orphanNotes" :key="note.id">
            <PlantingRecordCard
              v-if="note.type === 'planting'"
              :note="note"
              :actions="actions"
              :skills="skills"
              :is-night-mode="isNightMode"
            />
            <button
              v-else
              class="w-full rounded-2xl border p-5 text-left"
              :class="isNightMode ? 'border-sky-900/40 bg-[#181421]' : 'border-sky-200 bg-sky-50/70'"
              @click="$emit('open-essay', note.id)"
            >
              <div class="flex flex-wrap gap-2 text-xs font-bold text-sky-600">
                <span>巡林随笔</span><span>· {{ orphanOwner(note) }}</span>
              </div>
              <h4 class="mt-2 text-lg font-black">{{ note.title }}</h4>
              <p class="mt-3 line-clamp-3 text-sm opacity-70">{{ preview(note.content) }}</p>
            </button>
          </template>
        </div>
        <div v-else class="empty mt-4">当前分类没有失去行动归属的历史记录。</div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useActionStore } from '@/stores/actionStore'
import { useAppStore } from '@/stores/appStore'
import { useNotebookStore } from '@/stores/notebookStore'
import PlantingRecordCard from './PlantingRecordCard.vue'

defineEmits(['create-essay', 'open-essay'])

const UNCATEGORIZED = '__uncategorized__'
const appStore = useAppStore()
const actionStore = useActionStore()
const notebookStore = useNotebookStore()
const { isNightMode } = storeToRefs(appStore)
const { actions, skills } = storeToRefs(actionStore)
const { notebook } = storeToRefs(notebookStore)
const selectedSkillId = ref('all')
const selectedActionId = ref(null)
const searchQuery = ref('')

const selectedAction = computed(
  () =>
    actions.value.find((item) => String(item.id) === String(selectedActionId.value)) || null,
)
const selectedPlantingNotes = computed(() =>
  notebook.value.filter(
    (note) =>
      note.type === 'planting' &&
      note.actionIds?.some((actionId) => String(actionId) === String(selectedActionId.value)) &&
      matchesSearch(note),
  ),
)
const selectedEssayNotes = computed(() =>
  notebook.value.filter(
    (note) =>
      note.type === 'essay' &&
      note.actionIds?.some((actionId) => String(actionId) === String(selectedActionId.value)) &&
      matchesSearch(note),
  ),
)

const orphanRecords = computed(() =>
  notebook.value.filter(
    (note) =>
      note.type !== 'system' &&
      !note.actionIds?.some((actionId) =>
        actions.value.some((item) => String(item.id) === String(actionId)),
      ),
  ),
)

const skillOptions = computed(() => [
  { id: 'all', label: '全部', count: actions.value.length + orphanRecords.value.length },
  ...skills.value.map((skill) => ({
    id: skill.id,
    label: skill.name,
    count:
      actions.value.filter((action) => String(action.skillId) === String(skill.id)).length +
      orphanRecords.value.filter((note) => String(note.skillId) === String(skill.id)).length,
  })),
  {
    id: UNCATEGORIZED,
    label: '未分类',
    count:
      actions.value.filter((action) => !action.skillId).length +
      orphanRecords.value.filter((note) => !note.skillId).length,
  },
])

const filteredActions = computed(() => {
  if (selectedSkillId.value === 'all') return actions.value
  if (selectedSkillId.value === UNCATEGORIZED) return actions.value.filter((action) => !action.skillId)
  return actions.value.filter(
    (action) => String(action.skillId) === String(selectedSkillId.value),
  )
})

const orphanNotes = computed(() => {
  if (selectedSkillId.value === 'all') return orphanRecords.value.filter(matchesSearch)
  if (selectedSkillId.value === UNCATEGORIZED) {
    return orphanRecords.value.filter((note) => !note.skillId && matchesSearch(note))
  }
  return orphanRecords.value.filter(
    (note) => String(note.skillId) === String(selectedSkillId.value) && matchesSearch(note),
  )
})

watch(selectedAction, (action) => {
  if (!action) selectedActionId.value = null
})

function skillName(skillId) {
  if (!skillId) return '未归属技能'
  return skills.value.find((skill) => String(skill.id) === String(skillId))?.name || '已删除技能'
}

function noteCount(actionId) {
  return notebook.value.filter(
    (note) =>
      note.type !== 'system' &&
      note.actionIds?.some((noteActionId) => String(noteActionId) === String(actionId)),
  ).length
}

function orphanOwner(note) {
  const skill = skills.value.find((item) => String(item.id) === String(note.skillId))
  if (skill) return `${skill.name} · 历史记录`
  if (note.skillNameSnapshot) return `${note.skillNameSnapshot} · 已删除技能`
  return '未分类记录'
}

function preview(content) {
  if (!content) return '暂无内容'
  return content.length > 100 ? `${content.slice(0, 100)}…` : content
}

function matchesSearch(note) {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  if (!query) return true
  return [
    note.title,
    note.content,
    note.actionNameSnapshot,
    note.skillNameSnapshot,
    note.treeNameSnapshot,
  ]
    .join(' ')
    .toLocaleLowerCase()
    .includes(query)
}

function formatDuration(seconds = 0) {
  const totalMinutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours} 小时 ${minutes} 分` : `${minutes} 分钟`
}

function tabClass(optionId) {
  if (selectedSkillId.value === optionId) {
    return isNightMode.value
      ? 'border-emerald-700 bg-emerald-900/20'
      : 'border-emerald-300 bg-emerald-50'
  }
  return isNightMode.value ? 'border-white/10 bg-black/20' : 'border-[#e5dfd1] bg-white/85'
}
</script>

<style scoped>
.stat {
  border: 1px solid rgb(156 163 175 / 0.22);
  border-radius: 0.75rem;
  padding: 0.65rem 0.75rem;
  text-align: center;
  font-weight: 700;
}

.empty {
  border: 1px dashed rgb(156 163 175 / 0.35);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  opacity: 0.65;
}
</style>
