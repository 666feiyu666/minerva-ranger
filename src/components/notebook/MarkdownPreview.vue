<template>
  <div
    v-if="source.trim()"
    class="markdown-preview"
    :class="isNightMode ? 'text-gray-200' : 'text-gray-700'"
    v-html="rendered"
  />
  <div v-else class="rounded-2xl border border-dashed p-8 text-center text-sm opacity-55">
    预览会随着书写实时更新。
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps({
  source: { type: String, default: '' },
  isNightMode: { type: Boolean, default: false },
})

const rendered = computed(() => renderMarkdown(props.source))
</script>

<style scoped>
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  margin: 1.35em 0 0.6em;
  font-weight: 900;
  line-height: 1.25;
}

.markdown-preview :deep(h1) { font-size: 1.8rem; }
.markdown-preview :deep(h2) { font-size: 1.45rem; }
.markdown-preview :deep(h3) { font-size: 1.2rem; }
.markdown-preview :deep(p),
.markdown-preview :deep(ul),
.markdown-preview :deep(ol),
.markdown-preview :deep(blockquote) { margin: 0.8em 0; line-height: 1.8; }
.markdown-preview :deep(ul) { list-style: disc; padding-left: 1.5rem; }
.markdown-preview :deep(ol) { list-style: decimal; padding-left: 1.5rem; }
.markdown-preview :deep(blockquote) {
  border-left: 3px solid rgb(14 165 233 / 0.6);
  padding-left: 1rem;
  opacity: 0.8;
}
.markdown-preview :deep(code) {
  border-radius: 0.35rem;
  background: rgb(127 127 127 / 0.14);
  padding: 0.15rem 0.35rem;
}
.markdown-preview :deep(pre) {
  overflow-x: auto;
  border-radius: 0.9rem;
  background: rgb(15 23 42 / 0.9);
  color: #e2e8f0;
  padding: 1rem;
}
.markdown-preview :deep(pre code) { background: transparent; padding: 0; }
.markdown-preview :deep(a) { color: #0284c7; text-decoration: underline; }
</style>
