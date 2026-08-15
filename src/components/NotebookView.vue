<template>
  <div class="notebook-page">
    <NotebookHeader
      :title="pageMeta.title"
      :description="pageMeta.description"
      :breadcrumbs="pageMeta.breadcrumbs"
      :show-back="currentSection !== 'home'"
      :is-night-mode="isNightMode"
      @back="handleBack"
    />

    <div class="notebook-page__content subtle-scrollbar">
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
    description: '把行动留下的线索整理为可回看的档案、随笔与变更记录。',
    breadcrumbs: ['笔记目录'],
  },
  actions: {
    title: '行动档案',
    description: '按行动、技能或未分类状态追溯种植记录与相关随笔。',
    breadcrumbs: ['笔记目录', '行动档案'],
  },
  essays: {
    title: '巡林随笔',
    description: '使用 Markdown 书写阶段总结、灵感与结构化复盘。',
    breadcrumbs: ['笔记目录', '巡林随笔'],
  },
  system: {
    title: '系统记录',
    description: '集中查看行动合并、删除等影响笔记归属的系统事件。',
    breadcrumbs: ['笔记目录', '系统记录'],
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
.notebook-page {
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 24px clamp(24px, 3vw, 42px) 0;
  color: var(--ink-strong);
  background:
    linear-gradient(
      90deg,
      transparent 0 31px,
      color-mix(in srgb, var(--danger-500) 18%, transparent) 31px 32px,
      transparent 32px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0 31px,
      color-mix(in srgb, var(--lake-500) 8%, transparent) 31px 32px
    );
}
.notebook-page__content {
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 16px 2px 56px;
}

@media (max-width: 980px) {
  .notebook-page {
    padding: 18px 16px 0;
  }
}

@media (max-height: 680px) {
  .notebook-page {
    padding-top: 14px;
  }
}
</style>
