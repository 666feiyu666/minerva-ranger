<template>
  <header class="notebook-header">
    <div>
      <p class="paper-label">巡林手记</p>
      <h2 class="display-title">{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <div class="notebook-header__trail">
      <button v-if="showBack" class="quiet-button" @click="$emit('back')">返回笔记目录</button>
      <ol aria-label="当前位置">
        <li v-for="crumb in breadcrumbs" :key="crumb">{{ crumb }}</li>
      </ol>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  breadcrumbs: { type: Array, default: () => ['笔记目录'] },
  showBack: { type: Boolean, default: false },
  isNightMode: { type: Boolean, default: false },
})

defineEmits(['back'])
</script>

<style scoped>
.notebook-header {
  display: flex;
  min-width: 0;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding: 2px 4px 18px;
  border-bottom: 1px solid var(--line-soft);
  color: var(--ink-strong);
}
.notebook-header > div:first-child {
  min-width: 0;
  flex: 1;
}
.notebook-header h2 {
  margin: 7px 0 5px;
}
.notebook-header > div > p:last-child {
  max-width: 680px;
  color: var(--ink-muted);
  font-size: 13px;
  line-height: 1.65;
}
.notebook-header__trail {
  min-width: 0;
  flex: 0 1 auto;
  display: grid;
  justify-items: end;
  gap: 9px;
}
.notebook-header__trail ol {
  display: flex;
  max-width: 100%;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
  margin: 0;
  padding: 0;
  color: var(--ink-faint);
  font-size: 11px;
  list-style: none;
}

@media (max-width: 980px) {
  .notebook-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .notebook-header__trail {
    width: 100%;
    justify-items: start;
  }

  .notebook-header__trail ol {
    justify-content: flex-start;
  }
}
.notebook-header__trail li + li::before {
  content: '/';
  margin-right: 5px;
  color: var(--line-strong);
}
</style>
