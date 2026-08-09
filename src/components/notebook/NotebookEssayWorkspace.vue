<template>
  <section
    class="rounded-[2rem] border shadow-xl overflow-hidden"
    :class="isNightMode ? 'bg-[#15131a] border-[#4a3d62] text-white' : 'bg-[#fbf8ff] border-[#ddd2ec] text-gray-800'"
  >
    <template v-if="mode === 'list'">
      <div class="border-b p-5" :class="isNightMode ? 'border-white/10' : 'border-[#e7deef]'">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            v-model="searchQuery"
            class="min-w-0 flex-1 rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-sky-500"
            :class="isNightMode ? 'border-white/10' : 'border-[#ddd2ec] bg-white/80'"
            placeholder="搜索标题、正文、行动或技能"
          />
          <select
            v-model="ownerFilter"
            class="rounded-xl border bg-transparent px-4 py-3"
            :class="isNightMode ? 'border-white/10 bg-[#15131a]' : 'border-[#ddd2ec] bg-white'"
          >
            <option value="all">全部归属</option>
            <optgroup label="技能">
              <option v-for="skill in skills" :key="skill.id" :value="`skill:${skill.id}`">
                {{ skill.name }}
              </option>
            </optgroup>
            <optgroup label="行动">
              <option v-for="action in actions" :key="action.id" :value="`action:${action.id}`">
                {{ action.name }}
              </option>
            </optgroup>
            <option value="uncategorized">未分类</option>
          </select>
          <button class="rounded-xl bg-sky-600 px-5 py-3 font-bold text-white" @click="startCreate()">
            + 写随笔
          </button>
        </div>
      </div>

      <div class="p-6">
        <div v-if="filteredEssays.length" class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <button
            v-for="note in filteredEssays"
            :key="note.id"
            class="rounded-2xl border p-5 text-left transition-all hover:-translate-y-1"
            :class="isNightMode ? 'border-sky-900/50 bg-black/15' : 'border-sky-200 bg-white/85'"
            @click="openEssay(note.id)"
          >
            <div class="flex items-center justify-between gap-3 text-xs font-bold text-sky-600">
              <span>{{ ownerLabel(note) }}</span>
              <span class="opacity-60">{{ displayDate(note.updatedAt || note.date) }}</span>
            </div>
            <h3 class="mt-3 text-xl font-black">{{ note.title }}</h3>
            <p class="mt-3 line-clamp-4 text-sm leading-6 opacity-65">{{ textPreview(note.content) }}</p>
            <div class="mt-4 text-xs font-bold opacity-45">{{ note.wordCount || 0 }} 个有效字符</div>
          </button>
        </div>
        <div v-else class="rounded-2xl border border-dashed p-12 text-center opacity-60">
          {{ essays.length ? '没有匹配搜索或筛选条件的随笔。' : '当前还没有随笔。' }}
        </div>
      </div>
    </template>

    <template v-else>
      <div class="border-b px-6 py-4" :class="isNightMode ? 'border-white/10' : 'border-[#e7deef]'">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <button class="text-sm font-bold opacity-70 hover:opacity-100" @click="closeEditor">← 返回随笔列表</button>
          <div class="flex flex-wrap gap-2">
            <button v-if="mode === 'view'" class="rounded-full border px-4 py-2 text-sm font-bold" @click="beginEdit">编辑</button>
            <button
              v-if="mode === 'view'"
              class="rounded-full border border-red-400/40 px-4 py-2 text-sm font-bold text-red-500"
              @click="removeCurrent"
            >删除</button>
            <button v-if="mode === 'edit'" class="rounded-full border px-4 py-2 text-sm font-bold" @click="cancelEdit">取消</button>
            <button
              v-if="mode === 'edit'"
              class="rounded-full bg-sky-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
              :disabled="!canSave"
              @click="saveEssay"
            >保存随笔</button>
          </div>
        </div>
      </div>

      <div v-if="mode === 'view' && currentNote" class="p-6 lg:p-8">
        <div class="mx-auto max-w-4xl">
          <div class="text-xs font-bold text-sky-600">{{ ownerLabel(currentNote) }}</div>
          <h3 class="mt-3 text-3xl font-black">{{ currentNote.title }}</h3>
          <div class="mt-2 text-xs opacity-50">最后更新：{{ displayDate(currentNote.updatedAt || currentNote.date) }}</div>
          <div class="mt-8"><MarkdownPreview :source="currentNote.content" :is-night-mode="isNightMode" /></div>
        </div>
      </div>

      <div v-else>
        <div class="grid grid-cols-2 gap-2 border-b p-3 lg:hidden" :class="isNightMode ? 'border-white/10' : 'border-[#e7deef]'">
          <button class="rounded-xl px-4 py-2 text-sm font-bold" :class="mobilePane === 'edit' ? 'bg-sky-600 text-white' : 'border'" @click="mobilePane = 'edit'">编辑</button>
          <button class="rounded-xl px-4 py-2 text-sm font-bold" :class="mobilePane === 'preview' ? 'bg-sky-600 text-white' : 'border'" @click="mobilePane = 'preview'">预览</button>
        </div>
        <div class="grid min-h-[32rem] lg:grid-cols-2">
        <div
          class="space-y-4 border-b p-6 lg:block lg:border-b-0 lg:border-r"
          :class="[
            isNightMode ? 'border-white/10' : 'border-[#e7deef]',
            mobilePane === 'edit' ? 'block' : 'hidden',
          ]"
        >
          <input
            v-model="draft.title"
            class="w-full rounded-xl border bg-transparent px-4 py-3 text-xl font-black outline-none focus:border-sky-500"
            :class="isNightMode ? 'border-white/10' : 'border-[#ddd2ec] bg-white/80'"
            placeholder="随笔标题"
          />
          <div class="grid gap-3 sm:grid-cols-2">
            <select
              v-model="draft.actionId"
              class="rounded-xl border bg-transparent px-4 py-3"
              :class="isNightMode ? 'border-white/10 bg-[#15131a]' : 'border-[#ddd2ec] bg-white'"
              @change="syncSkillFromAction"
            >
              <option value="">不关联行动</option>
              <option v-for="action in actions" :key="action.id" :value="String(action.id)">{{ action.name }}</option>
            </select>
            <select
              v-model="draft.skillId"
              class="rounded-xl border bg-transparent px-4 py-3 disabled:opacity-50"
              :class="isNightMode ? 'border-white/10 bg-[#15131a]' : 'border-[#ddd2ec] bg-white'"
              :disabled="Boolean(draft.actionId)"
            >
              <option value="">未分类</option>
              <option v-for="skill in skills" :key="skill.id" :value="String(skill.id)">{{ skill.name }}</option>
            </select>
          </div>
          <textarea
            v-model="draft.content"
            class="min-h-[24rem] w-full resize-y rounded-xl border bg-transparent px-4 py-3 font-mono text-sm leading-7 outline-none focus:border-sky-500"
            :class="isNightMode ? 'border-white/10' : 'border-[#ddd2ec] bg-white/80'"
            placeholder="使用 Markdown 书写……"
          />
          <p class="text-xs opacity-55">支持标题、列表、引用、链接与代码块；V0.2 暂不支持图片。</p>
        </div>
        <div class="p-6 lg:block" :class="mobilePane === 'preview' ? 'block' : 'hidden'">
          <div class="mb-4 text-xs font-bold uppercase tracking-widest opacity-50">安全预览</div>
          <MarkdownPreview :source="draft.content" :is-night-mode="isNightMode" />
        </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { choiceDialog, confirmDialog } from '@/composables/dialogService'
import { useActionStore } from '@/stores/actionStore'
import { useAppStore } from '@/stores/appStore'
import { useNotebookStore } from '@/stores/notebookStore'
import MarkdownPreview from './MarkdownPreview.vue'

const appStore = useAppStore()
const actionStore = useActionStore()
const notebookStore = useNotebookStore()
const { isNightMode } = storeToRefs(appStore)
const { actions, skills } = storeToRefs(actionStore)
const { notebook } = storeToRefs(notebookStore)
const mode = ref('list')
const currentNoteId = ref(null)
const searchQuery = ref('')
const ownerFilter = ref('all')
const mobilePane = ref('edit')
const draft = reactive({ title: '', content: '', actionId: '', skillId: '' })
const savedDraftSignature = ref('')

const essays = computed(() => notebook.value.filter((note) => note.type === 'essay' && note.source !== 'system').slice().sort((left, right) => new Date(right.updatedAt || right.date) - new Date(left.updatedAt || left.date)))
const currentNote = computed(() => essays.value.find((note) => note.id === currentNoteId.value) || null)
const canSave = computed(() => draft.title.trim() && draft.content.trim())
const hasUnsavedChanges = computed(
  () => mode.value === 'edit' && draftSignature() !== savedDraftSignature.value,
)
const filteredEssays = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return essays.value.filter((note) => matchesOwner(note) && matchesQuery(note, query))
})

async function startCreate(actionId = null) {
  if (!(await requestLeave())) return false
  currentNoteId.value = null
  draft.title = ''
  draft.content = ''
  draft.actionId = actionId == null ? '' : String(actionId)
  draft.skillId = ''
  mobilePane.value = 'edit'
  syncSkillFromAction()
  savedDraftSignature.value = draftSignature()
  mode.value = 'edit'
  return true
}

async function openEssay(noteId) {
  if (!(await requestLeave())) return false
  currentNoteId.value = noteId
  mode.value = 'view'
  return true
}

function beginEdit() {
  if (!currentNote.value) return
  draft.title = currentNote.value.title
  draft.content = currentNote.value.content
  draft.actionId = currentNote.value.actionIds?.[0] == null ? '' : String(currentNote.value.actionIds[0])
  draft.skillId = currentNote.value.skillId == null ? '' : String(currentNote.value.skillId)
  mobilePane.value = 'edit'
  savedDraftSignature.value = draftSignature()
  mode.value = 'edit'
}

async function cancelEdit() {
  if (!(await requestLeave())) return
  mode.value = currentNote.value ? 'view' : 'list'
}

async function closeEditor() {
  if (!(await requestLeave())) return
  currentNoteId.value = null
  mode.value = 'list'
}

function saveEssay() {
  if (!canSave.value) return false
  const actionIds = draft.actionId ? [draft.actionId] : []
  const skillId = draft.skillId || null
  let saved = false
  if (currentNoteId.value) {
    saved = notebookStore.updateNote(currentNoteId.value, {
      title: draft.title.trim(), content: draft.content.trim(), actionIds, skillId, contentFormat: 'markdown',
    })
  } else {
    const created = notebookStore.createEssayNote(draft.title.trim(), draft.content.trim(), actionIds, { skillId })
    currentNoteId.value = created?.id || null
    saved = Boolean(created)
  }
  if (saved && currentNoteId.value) {
    savedDraftSignature.value = draftSignature()
    mode.value = 'view'
  }
  return saved
}

async function requestLeave() {
  if (!hasUnsavedChanges.value) return true
  const choice = await choiceDialog('当前随笔有尚未保存的修改。保存后离开、放弃修改，还是继续编辑？', {
    title: '处理未保存修改',
    cancelText: '继续编辑',
    choices: [
      { label: '放弃修改', value: 'discard' },
      {
        label: '保存后离开',
        value: 'save',
        className: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
      },
    ],
  })
  if (choice === 'save') return saveEssay()
  return choice === 'discard'
}

async function removeCurrent() {
  if (!currentNote.value) return
  const confirmed = await confirmDialog(`确定删除随笔“${currentNote.value.title}”吗？`, {
    title: '删除巡林随笔', confirmText: '删除', danger: true,
  })
  if (!confirmed) return
  notebookStore.deleteNote(currentNote.value.id)
  closeEditor()
}

function syncSkillFromAction() {
  if (!draft.actionId) return
  const action = actions.value.find((item) => String(item.id) === draft.actionId)
  draft.skillId = action?.skillId == null ? '' : String(action.skillId)
}

function matchesOwner(note) {
  if (ownerFilter.value === 'all') return true
  if (ownerFilter.value === 'uncategorized') return !note.actionIds?.length && !note.skillId
  const [kind, id] = ownerFilter.value.split(':')
  if (kind === 'action') return note.actionIds?.some((actionId) => String(actionId) === id)
  return String(note.skillId) === id
}

function matchesQuery(note, query) {
  if (!query) return true
  return [note.title, note.content, note.actionNameSnapshot, note.skillNameSnapshot, ownerLabel(note)]
    .join(' ').toLocaleLowerCase().includes(query)
}

function ownerLabel(note) {
  const action = actions.value.find((item) => note.actionIds?.some((id) => String(id) === String(item.id)))
  if (action) return `${action.name} · ${skillLabel(action.skillId)}`
  const skill = skills.value.find((item) => String(item.id) === String(note.skillId))
  if (skill) return `${skill.name} · 历史记录`
  if (note.actionNameSnapshot) return `${note.actionNameSnapshot} · 行动已删除`
  if (note.skillNameSnapshot) return `${note.skillNameSnapshot} · 技能已删除`
  return '未分类'
}

function skillLabel(skillId) {
  return skills.value.find((item) => String(item.id) === String(skillId))?.name || '未归属技能'
}

function textPreview(content = '') {
  const plain = content
    .replace(/[#>*_`()~-]/g, ' ')
    .replaceAll('[', ' ')
    .replaceAll(']', ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain || '暂无正文'
}

function displayDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value || '') : date.toLocaleDateString('zh-CN')
}

function draftSignature() {
  return JSON.stringify({
    title: draft.title,
    content: draft.content,
    actionId: draft.actionId,
    skillId: draft.skillId,
  })
}

function handleBeforeUnload(event) {
  if (!hasUnsavedChanges.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', handleBeforeUnload))

defineExpose({ hasUnsavedChanges, openEssay, requestLeave, startCreate })
</script>
