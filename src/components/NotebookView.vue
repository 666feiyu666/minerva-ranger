<template>
  <div class="relative flex h-full flex-1 flex-col overflow-hidden bg-transparent p-6">
    <NotebookHeader
      :title="pageMeta.title"
      :description="pageMeta.description"
      :breadcrumbs="pageMeta.breadcrumbs"
      :show-back="currentSection !== 'home'"
      :is-night-mode="isNightMode"
      @back="handleBack"
    />

    <div class="custom-scrollbar flex-1 overflow-y-auto pb-24 pr-2 pt-4">
      <NotebookHome v-if="currentSection === 'home'" @open="openSection" />
      <NotebookActionArchive
        v-else-if="currentSection === 'actions'"
        @create-essay="openComposer"
        @open-essay="openEssay"
      />
      <NotebookEssayWorkspace v-else-if="currentSection === 'essays'" ref="essayWorkspace" />
      <NotebookSystemRecords v-else-if="currentSection === 'system'" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/appStore'
import NotebookActionArchive from './notebook/NotebookActionArchive.vue'
import NotebookEssayWorkspace from './notebook/NotebookEssayWorkspace.vue'
import NotebookHeader from './notebook/NotebookHeader.vue'
import NotebookHome from './notebook/NotebookHome.vue'
import NotebookSystemRecords from './notebook/NotebookSystemRecords.vue'

const appStore = useAppStore()
const { isNightMode, notebookComposeRequest } = storeToRefs(appStore)
const currentSection = ref('home')
const essayWorkspace = ref(null)
let handledComposeToken = null
let unregisterViewGuard = null

const metaBySection = {
  home: {
    title: '巡林笔记',
    description: '通过书写来表达、整理和沉淀。',
    breadcrumbs: ['笔记首页'],
  },
  actions: {
    title: '行动档案',
    description: '按行动、技能或未分类追溯植树记录与相关随笔。',
    breadcrumbs: ['巡林笔记', '行动档案'],
  },
  essays: {
    title: '巡林随笔',
    description: '使用 Markdown 书写阶段总结、灵感与结构化复盘。',
    breadcrumbs: ['巡林笔记', '巡林随笔'],
  },
  system: {
    title: '系统记录',
    description: '集中查看行动合并、删除等影响笔记归属的系统事件。',
    breadcrumbs: ['巡林笔记', '系统记录'],
  },
}

const pageMeta = computed(() => metaBySection[currentSection.value] || metaBySection.home)

function openSection(sectionId) {
  currentSection.value = sectionId
}

async function openComposer(actionId = null) {
  currentSection.value = 'essays'
  await nextTick()
  return (await essayWorkspace.value?.startCreate(actionId)) ?? true
}

async function openEssay(noteId) {
  currentSection.value = 'essays'
  await nextTick()
  essayWorkspace.value?.openEssay(noteId)
}

async function handleComposeRequest(request) {
  if (!request || request.token === handledComposeToken) return
  handledComposeToken = request.token
  await openComposer(request.actionId)
}

async function handleBack() {
  if (currentSection.value === 'essays') {
    const canLeave = (await essayWorkspace.value?.requestLeave()) ?? true
    if (!canLeave) return
  }
  currentSection.value = 'home'
}

async function guardViewChange() {
  if (currentSection.value !== 'essays') return true
  return (await essayWorkspace.value?.requestLeave()) ?? true
}

watch(notebookComposeRequest, handleComposeRequest, { deep: true })
onMounted(() => {
  unregisterViewGuard = appStore.registerViewChangeGuard(guardViewChange)
  handleComposeRequest(notebookComposeRequest.value)
})
onUnmounted(() => unregisterViewGuard?.())
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(156 163 175 / 0.32); border-radius: 999px; }
</style>
