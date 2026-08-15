<template>
  <section class="notebook-index">
    <button
      v-for="(item, index) in sections"
      :key="item.id"
      class="notebook-entry paper-panel"
      @click="$emit('open', item.id)"
    >
      <span class="notebook-entry__number" aria-hidden="true">{{
        String(index + 1).padStart(2, '0')
      }}</span>
      <div class="notebook-entry__copy">
        <p class="paper-label">{{ item.eyebrow }}</p>
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </div>
      <dl>
        <div>
          <dt>{{ item.primaryLabel }}</dt>
          <dd>{{ item.primaryValue }}</dd>
        </div>
        <div>
          <dt>{{ item.secondaryLabel }}</dt>
          <dd>{{ item.secondaryValue }}</dd>
        </div>
      </dl>
      <span class="notebook-entry__arrow" aria-hidden="true">→</span>
    </button>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useActionStore } from '@/stores/actionStore'
import { useNotebookStore } from '@/stores/notebookStore'

defineEmits(['open'])

const actionStore = useActionStore()
const notebookStore = useNotebookStore()
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
    eyebrow: '行动归档',
    title: '行动档案',
    description: '按行动与技能回看种植历史、现场记录和相关随笔。',
    primaryLabel: '行动',
    primaryValue: actions.value.length,
    secondaryLabel: '个人记录',
    secondaryValue: userNotes.value.length,
  },
  {
    id: 'essays',
    eyebrow: '阶段书写',
    title: '巡林随笔',
    description: '记录阶段总结、灵感，以及值得沉淀的结构化复盘。',
    primaryLabel: '随笔',
    primaryValue: essayNotes.value.length,
    secondaryLabel: '最近更新',
    secondaryValue:
      displayDate(essayNotes.value[0]?.updatedAt || essayNotes.value[0]?.date) || '暂无随笔',
  },
  {
    id: 'system',
    eyebrow: '变更轨迹',
    title: '系统记录',
    description: '查看行动合并、删除等会影响笔记归属的系统事件。',
    primaryLabel: '记录',
    primaryValue: systemNotes.value.length,
    secondaryLabel: '最近更新',
    secondaryValue:
      displayDate(systemNotes.value[0]?.updatedAt || systemNotes.value[0]?.date) || '暂无记录',
  },
])

function displayDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.notebook-index {
  display: grid;
  gap: 10px;
}
.notebook-entry {
  position: relative;
  display: grid;
  min-width: 0;
  grid-template-columns: 54px minmax(280px, 1fr) minmax(240px, 0.7fr) 32px;
  align-items: center;
  min-height: 142px;
  padding: 20px 22px;
  text-align: left;
  color: var(--ink-strong);
  transition: 150ms ease;
}
.notebook-entry:hover {
  border-color: var(--line-strong);
  transform: translateX(2px);
  box-shadow: var(--shadow-card);
}
.notebook-entry__number {
  align-self: stretch;
  padding-top: 4px;
  border-right: 1px solid var(--line-soft);
  color: var(--ink-faint);
  font-family: Georgia, serif;
  font-size: 16px;
}
.notebook-entry__copy {
  padding: 0 28px 0 20px;
}
.notebook-entry h3 {
  margin: 5px 0 7px;
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: 22px;
}
.notebook-entry__copy > p:last-child {
  max-width: 540px;
  color: var(--ink-muted);
  font-size: 13px;
  line-height: 1.65;
}
.notebook-entry dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border-left: 1px solid var(--line-soft);
}
.notebook-entry dl div {
  min-width: 0;
  padding: 3px 16px;
}
.notebook-entry dt {
  color: var(--ink-faint);
  font-size: 10px;
}
.notebook-entry dd {
  margin: 5px 0 0;
  overflow: hidden;
  color: var(--forest-700);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notebook-entry__arrow {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid var(--line-soft);
  border-radius: 50%;
  color: var(--forest-700);
}
@media (max-width: 1180px) {
  .notebook-entry {
    grid-template-columns: 44px minmax(260px, 1fr) 210px 30px;
  }
  .notebook-entry__copy {
    padding-inline: 16px;
  }
}

@media (max-width: 900px) {
  .notebook-entry {
    grid-template-columns: 36px minmax(0, 1fr) 30px;
    row-gap: 14px;
    padding: 16px;
  }

  .notebook-entry__copy {
    padding: 0 12px;
  }

  .notebook-entry dl {
    grid-column: 2;
    border-left: 0;
    border-top: 1px solid var(--line-soft);
    padding-top: 12px;
  }

  .notebook-entry__arrow {
    grid-column: 3;
    grid-row: 1 / 3;
  }
}
</style>
