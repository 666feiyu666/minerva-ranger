<template>
  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <button
      v-for="item in sections"
      :key="item.id"
      class="rounded-[2rem] border p-6 text-left shadow-xl transition-all hover:-translate-y-1"
      :class="cardClass(item.id)"
      @click="$emit('open', item.id)"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-xs uppercase tracking-[0.24em] font-bold opacity-50">
            {{ item.eyebrow }}
          </div>
          <h3 class="mt-3 text-2xl font-black">{{ item.title }}</h3>
          <p class="mt-3 text-sm leading-6 opacity-75">{{ item.description }}</p>
        </div>
        <div class="w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shrink-0">
          {{ item.icon }}
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-6">
        <div class="rounded-2xl border px-4 py-4">
          <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
            {{ item.primaryLabel }}
          </div>
          <div class="mt-1 text-lg font-black">{{ item.primaryValue }}</div>
        </div>
        <div class="rounded-2xl border px-4 py-4">
          <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
            {{ item.secondaryLabel }}
          </div>
          <div class="mt-1 text-sm font-black truncate">{{ item.secondaryValue }}</div>
        </div>
      </div>
    </button>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useActionStore } from '@/stores/actionStore'
import { useAppStore } from '@/stores/appStore'
import { useNotebookStore } from '@/stores/notebookStore'

defineEmits(['open'])

const appStore = useAppStore()
const actionStore = useActionStore()
const notebookStore = useNotebookStore()
const { isNightMode } = storeToRefs(appStore)
const { actions } = storeToRefs(actionStore)
const { notebook } = storeToRefs(notebookStore)

const userNotes = computed(() => notebook.value.filter((note) => note.type !== 'system'))
const essayNotes = computed(() =>
  notebook.value
    .filter((note) => note.type === 'essay' && note.source !== 'system')
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)),
)
const systemNotes = computed(() => notebook.value.filter((note) => note.type === 'system'))

const sections = computed(() => [
  {
    id: 'actions',
    eyebrow: 'Archive',
    title: '行动档案',
    description: '按行动、技能或未分类查看巡林历史。',
    icon: '📁',
    primaryLabel: 'Actions',
    primaryValue: actions.value.length,
    secondaryLabel: 'User Records',
    secondaryValue: userNotes.value.length,
  },
  {
    id: 'essays',
    eyebrow: 'Essays',
    title: '巡林随笔',
    description: '记录阶段总结、灵感和结构化复盘。',
    icon: '🪶',
    primaryLabel: 'Essays',
    primaryValue: essayNotes.value.length,
    secondaryLabel: 'Latest',
    secondaryValue: displayDate(essayNotes.value[0]?.updatedAt || essayNotes.value[0]?.date) || '暂无随笔',
  },
  {
    id: 'system',
    eyebrow: 'System',
    title: '系统记录',
    description: '查看行动合并、删除等系统事件。',
    icon: '📜',
    primaryLabel: 'Records',
    primaryValue: systemNotes.value.length,
    secondaryLabel: 'Latest',
    secondaryValue: displayDate(systemNotes.value[0]?.updatedAt || systemNotes.value[0]?.date) || '暂无记录',
  },
])

function cardClass(sectionId) {
  if (sectionId === 'essays') {
    return isNightMode.value
      ? 'bg-[#15131a] border-[#4a3d62] hover:border-sky-700 text-white'
      : 'bg-[#fbf8ff] border-[#ddd2ec] hover:border-sky-300 text-gray-800'
  }
  if (sectionId === 'system') {
    return isNightMode.value
      ? 'bg-[#17120d] border-[#4f3f28] hover:border-amber-700 text-white'
      : 'bg-[#fff8ee] border-[#ead6b2] hover:border-amber-300 text-gray-800'
  }
  return isNightMode.value
    ? 'bg-[#121613] border-[#33463a] hover:border-emerald-700 text-white'
    : 'bg-[#fbfaf5] border-[#ddd8cc] hover:border-emerald-300 text-gray-800'
}

function displayDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('zh-CN')
}
</script>
