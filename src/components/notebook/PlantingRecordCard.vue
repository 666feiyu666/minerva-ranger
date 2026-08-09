<template>
  <article
    class="rounded-2xl border p-5 shadow-sm"
    :class="isNightMode ? 'border-white/10 bg-black/20' : 'border-[#e5dfd1] bg-white/85'"
  >
    <template v-if="editing">
      <div class="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div class="space-y-3">
          <input v-model="draft.title" class="field" :class="fieldClass" placeholder="标题" />
          <textarea
            v-model="draft.content"
            class="field h-36 resize-none"
            :class="fieldClass"
            placeholder="会话备注可以为空"
          ></textarea>
        </div>
        <div class="space-y-3">
          <select v-model="draft.actionId" class="field" :class="fieldClass">
            <option value="">不关联行动</option>
            <option v-for="action in actions" :key="action.id" :value="action.id">
              {{ action.name }}
            </option>
          </select>
          <select
            v-if="!draft.actionId"
            v-model="draft.skillId"
            class="field"
            :class="fieldClass"
          >
            <option value="">未分类</option>
            <option v-for="skill in skills" :key="skill.id" :value="skill.id">
              {{ skill.name }}
            </option>
          </select>
          <button class="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white" @click="save">
            保存修改
          </button>
          <button class="w-full rounded-xl border py-3 font-bold" @click="cancel">取消</button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex flex-wrap gap-2 text-[11px] font-bold">
            <span class="rounded-full border px-2 py-1 text-emerald-600">植树记录</span>
            <span class="rounded-full border px-2 py-1 opacity-70">{{ ownerLabel }}</span>
            <span v-if="!note.actionIds?.length && note.actionNameSnapshot" class="rounded-full border px-2 py-1 text-amber-600">
              行动已删除
            </span>
          </div>
          <h4 class="mt-3 text-lg font-black break-words">{{ note.title }}</h4>
          <p class="mt-1 text-xs opacity-55">{{ note.date }}</p>
        </div>
        <div class="flex gap-2 text-xs">
          <button class="rounded-full border px-3 py-1" @click="startEdit">编辑</button>
          <button class="rounded-full border px-3 py-1 text-red-500" @click="remove">删除</button>
        </div>
      </div>

      <div v-if="note.content" class="mt-4 whitespace-pre-wrap text-sm leading-7">{{ note.content }}</div>
      <div v-else class="mt-4 rounded-xl border border-dashed px-4 py-5 text-sm opacity-60">
        未填写会话备注
      </div>

      <div class="mt-4 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
        <div v-if="note.treeNameSnapshot || note.treeId" class="metric">树种 {{ note.treeNameSnapshot || note.treeId }}</div>
        <div class="metric">时长 {{ formatDuration(note.durationSeconds) }}</div>
        <div class="metric">周期 {{ note.completedCycles || 0 }}</div>
        <div class="metric">成果 {{ note.treesEarned || 0 }} 棵 · {{ note.xpEarned || 0 }} XP</div>
      </div>
      <div v-if="note.startedAt || note.endedAt" class="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div class="metric">开始 {{ formatDateTime(note.startedAt) }}</div>
        <div class="metric">结束 {{ formatDateTime(note.endedAt) }}</div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2 text-xs opacity-60">
        <span>结束原因：{{ endReasonLabel(note.endReason) }}</span>
        <span>字符 {{ note.wordCount || 0 }}</span>
        <span>笔记金币 +{{ note.coins || 0 }}</span>
      </div>
    </template>
  </article>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { confirmDialog } from '@/composables/dialogService'
import { useNotebookStore } from '@/stores/notebookStore'

const props = defineProps({
  note: { type: Object, required: true },
  actions: { type: Array, required: true },
  skills: { type: Array, required: true },
  isNightMode: { type: Boolean, default: false },
})

const notebookStore = useNotebookStore()
const editing = ref(false)
const draft = reactive({ title: '', content: '', actionId: '', skillId: '' })

const fieldClass = computed(() =>
  props.isNightMode
    ? 'border-gray-700 bg-[#0c0c0c] text-white'
    : 'border-gray-300 bg-white text-gray-800',
)

const ownerLabel = computed(() => {
  const actionId = props.note.actionIds?.[0]
  const action = props.actions.find((item) => item.id === actionId)
  if (action) return action.name
  const skill = props.skills.find((item) => item.id === props.note.skillId)
  if (skill) return `${skill.name} · 历史记录`
  if (props.note.skillNameSnapshot) return `${props.note.skillNameSnapshot} · 已删除技能`
  return '未分类记录'
})

function startEdit() {
  draft.title = props.note.title
  draft.content = props.note.content || ''
  draft.actionId = props.note.actionIds?.[0] || ''
  draft.skillId = props.note.skillId || ''
  editing.value = true
}

function cancel() {
  editing.value = false
}

function save() {
  const updated = notebookStore.updateNote(props.note.id, {
    title: draft.title,
    content: draft.content,
    actionIds: draft.actionId ? [draft.actionId] : [],
    skillId: draft.actionId ? undefined : draft.skillId || null,
  })
  if (updated) editing.value = false
}

async function remove() {
  const confirmed = await confirmDialog('确定删除这条植树记录吗？已结算成果和金币不会改变。', {
    title: '删除植树记录',
    confirmText: '删除',
  })
  if (confirmed) notebookStore.deleteNote(props.note.id)
}

function formatDuration(seconds) {
  const value = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function endReasonLabel(reason) {
  if (reason === 'limit') return '达到目标'
  if (reason === 'switch') return '切换任务'
  return '主动结束'
}

function formatDateTime(value) {
  if (!value) return '未知'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.field {
  width: 100%;
  border-width: 1px;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  outline: none;
}

.metric {
  border: 1px solid rgb(156 163 175 / 0.25);
  border-radius: 0.75rem;
  padding: 0.65rem 0.75rem;
}
</style>
