<template>
  <section
    class="rounded-[2rem] border shadow-xl overflow-hidden"
    :class="isNightMode ? 'bg-[#17120d] border-[#4f3f28]' : 'bg-[#fff8ee] border-[#ead6b2]'"
  >
    <div v-if="selectedNote" class="p-6">
      <button class="text-xs font-bold opacity-70 hover:opacity-100" @click="selectedNoteId = null">
        ← 返回系统记录
      </button>
      <div class="mt-5 flex flex-wrap items-center gap-2">
        <span class="rounded-full border px-2.5 py-1 text-[11px] font-bold text-amber-600">
          系统记录
        </span>
        <span v-if="eventLabel(selectedNote.eventType)" class="rounded-full border px-2.5 py-1 text-[11px]">
          {{ eventLabel(selectedNote.eventType) }}
        </span>
      </div>
      <h3 class="mt-4 text-2xl font-black">{{ selectedNote.title }}</h3>
      <p class="mt-2 text-xs opacity-60">{{ selectedNote.date }}</p>
      <div class="mt-6 whitespace-pre-wrap text-sm leading-7">{{ selectedNote.content || '暂无内容' }}</div>
      <div v-if="selectedNote.actionIds?.length" class="mt-5 text-xs opacity-70">
        关联：{{ actionNames(selectedNote.actionIds) }}
      </div>
    </div>

    <div v-else>
      <div class="px-6 py-5 border-b" :class="isNightMode ? 'border-white/10' : 'border-amber-200'">
        <h3 class="text-xl font-black">系统记录</h3>
        <p class="mt-2 text-sm opacity-70">系统生成的合并、删除和其他审计事件。</p>
      </div>
      <div v-if="systemNotes.length === 0" class="px-6 py-16 text-center">
        <div class="text-4xl mb-3">📜</div>
        <p class="font-semibold">当前还没有系统记录。</p>
      </div>
      <div v-else class="space-y-3 p-6">
        <button
          v-for="note in systemNotes"
          :key="note.id"
          class="w-full rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5"
          :class="isNightMode ? 'border-amber-900/60 bg-black/20' : 'border-amber-200 bg-white/65'"
          @click="selectedNoteId = note.id"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex flex-wrap gap-2 text-[11px] font-bold text-amber-600">
                <span>系统记录</span>
                <span v-if="eventLabel(note.eventType)">· {{ eventLabel(note.eventType) }}</span>
              </div>
              <h4 class="mt-2 text-lg font-black">{{ note.title }}</h4>
              <p class="mt-3 line-clamp-2 text-sm opacity-70">{{ note.content }}</p>
            </div>
            <span class="shrink-0 text-xs opacity-50">{{ note.date }}</span>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useActionStore } from '@/stores/actionStore'
import { useAppStore } from '@/stores/appStore'
import { useNotebookStore } from '@/stores/notebookStore'

const appStore = useAppStore()
const actionStore = useActionStore()
const notebookStore = useNotebookStore()
const { isNightMode } = storeToRefs(appStore)
const { actions } = storeToRefs(actionStore)
const { notebook } = storeToRefs(notebookStore)
const selectedNoteId = ref(null)

const systemNotes = computed(() => notebook.value.filter((note) => note.type === 'system'))
const selectedNote = computed(
  () => systemNotes.value.find((note) => note.id === selectedNoteId.value) || null,
)

watch(selectedNote, (note) => {
  if (!note) selectedNoteId.value = null
})

function eventLabel(eventType) {
  if (eventType === 'action_merge') return '行动合并'
  if (eventType === 'action_delete') return '行动删除'
  return '其他系统事件'
}

function actionNames(actionIds) {
  return actionIds
    .map(
      (actionId) =>
        actions.value.find((item) => String(item.id) === String(actionId))?.name || '已删除行动',
    )
    .join('、')
}
</script>
