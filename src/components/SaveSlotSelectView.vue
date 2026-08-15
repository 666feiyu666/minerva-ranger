<template>
  <div class="save-atlas">
    <aside class="save-atlas__intro">
      <div>
        <div class="save-atlas__brand">
          <span class="save-atlas__seal">M</span>
          <span>密涅瓦巡林志</span>
        </div>
        <p class="paper-label">身份档案</p>
        <h1>选择今天<br />要走进的森林</h1>
        <p class="save-atlas__lead">
          每份档案对应一个长期身份。你反复实践的行动会在这里生长成技能、树木与可回看的记录。
        </p>
      </div>

      <div class="save-atlas__note">
        <strong>使用建议</strong>
        <p>为不同的长期方向建立独立档案，例如“开发设计师”或“人类学研究者”。</p>
        <small>档案仅保存在当前设备，请定期导出 JSON 备份。</small>
      </div>
    </aside>

    <main class="save-atlas__main subtle-scrollbar">
      <div class="save-atlas__content">
        <header class="save-atlas__header">
          <div>
            <p class="paper-label">巡林入口</p>
            <h2 class="display-title">身份档案</h2>
            <p>共 {{ store.saveSlots.length }} 份档案，选择一份继续今天的行动。</p>
          </div>
          <div class="save-atlas__header-actions">
            <button class="quiet-button" @click="startImportAsNew">导入档案</button>
            <button class="primary-button" @click="createSlot">新建档案</button>
          </div>
        </header>

        <div class="save-atlas__storage-note" role="note">
          <span aria-hidden="true">本地</span>
          <p>所有档案都保存在这台设备上；导出备份后，可在另一台设备中继续使用。</p>
        </div>

        <component :is="DevToolsPanel" v-if="DevToolsPanel" class="save-atlas__devtools" />

        <section v-if="store.saveSlots.length === 0" class="save-atlas__empty paper-panel">
          <span class="save-atlas__empty-mark" aria-hidden="true">＋</span>
          <h3>还没有身份档案</h3>
          <p>先创建一个长期身份，或导入已有的 JSON 档案。</p>
          <div>
            <button class="primary-button" @click="createSlot">创建第一份档案</button>
            <button class="quiet-button" @click="startImportAsNew">导入已有档案</button>
          </div>
        </section>

        <section v-else class="save-atlas__list" aria-label="身份档案列表">
          <article
            v-for="(slot, index) in store.saveSlots"
            :key="slot.id"
            class="save-card paper-panel"
            :class="{ 'save-card--recent': store.saveIndex.lastSelectedSlotId === slot.id }"
          >
            <div class="save-card__index" aria-hidden="true">
              {{ String(index + 1).padStart(2, '0') }}
            </div>
            <div class="save-card__body">
              <div class="save-card__meta">
                <span>身份档案</span>
                <span v-if="store.saveIndex.lastSelectedSlotId === slot.id">最近使用</span>
                <span v-if="store.activeSlotId === slot.id">当前档案</span>
              </div>
              <h3>{{ slot.name }}</h3>
              <dl class="save-card__stats">
                <div>
                  <dt>巡林等级</dt>
                  <dd>Lv. {{ slot.summary.globalLevel }}</dd>
                </div>
                <div>
                  <dt>技能</dt>
                  <dd>{{ slot.summary.skillCount }}</dd>
                </div>
                <div>
                  <dt>行动</dt>
                  <dd>{{ slot.summary.actionCount }}</dd>
                </div>
                <div>
                  <dt>笔记</dt>
                  <dd>{{ slot.summary.noteCount }}</dd>
                </div>
              </dl>
              <p class="save-card__date">最后进入：{{ formatDate(slot.lastPlayedAt) }}</p>
            </div>
            <div class="save-card__actions">
              <button class="primary-button" @click="store.enterSlot(slot.id)">进入档案</button>
              <div class="save-card__secondary">
                <button class="quiet-button" @click="renameSlot(slot)">重命名</button>
                <button class="quiet-button" @click="store.downloadSaveFile(slot.id)">导出</button>
                <button
                  class="quiet-button"
                  :disabled="store.saveSlots[0]?.id === slot.id"
                  aria-label="向上移动"
                  @click="store.moveSaveSlot(slot.id, -1)"
                >
                  ↑
                </button>
                <button
                  class="quiet-button"
                  :disabled="store.saveSlots[store.saveSlots.length - 1]?.id === slot.id"
                  aria-label="向下移动"
                  @click="store.moveSaveSlot(slot.id, 1)"
                >
                  ↓
                </button>
                <button class="quiet-button" @click="startOverwriteImport(slot.id)">
                  覆盖导入
                </button>
                <button class="danger-button" @click="deleteSlot(slot)">删除</button>
              </div>
            </div>
          </article>
        </section>
      </div>

      <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImportFile" />
    </main>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { defineAsyncComponent, reactive, ref } from 'vue'
import { confirmDialog, promptDialog } from '@/composables/dialogService'
import { useSaveStore } from '@/stores/saveStore'

const saveStore = useSaveStore()
const store = reactive({
  ...storeToRefs(saveStore),
  createSaveSlot: saveStore.createSaveSlot,
  deleteSaveSlot: saveStore.deleteSaveSlot,
  downloadSaveFile: saveStore.downloadSaveFile,
  enterSlot: saveStore.enterSlot,
  importSaveAsNewSlot: saveStore.importSaveAsNewSlot,
  importSaveData: saveStore.importSaveData,
  moveSaveSlot: saveStore.moveSaveSlot,
  renameSaveSlot: saveStore.renameSaveSlot,
})
const fileInput = ref(null)
const importMode = ref({ type: 'new', slotId: null })
const isDevToolsMode = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true'
const DevToolsPanel = isDevToolsMode
  ? defineAsyncComponent(() => import('@/components/DevToolsPanel.vue'))
  : null

const formatDate = (value) => {
  if (!value) return '尚未进入'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const createSlot = async () => {
  const name = await promptDialog('请输入身份档案名称', {
    title: '新建身份档案',
    defaultValue:
      store.saveSlots.length === 0 ? '开发设计师' : `新身份档案 #${store.saveSlots.length + 1}`,
    confirmText: '创建',
  })
  if (name === null) return
  const slotId = store.createSaveSlot(name)
  if (slotId) store.enterSlot(slotId)
}

const renameSlot = async (slot) => {
  const name = await promptDialog('请输入新的身份档案名称', {
    title: '重命名身份档案',
    defaultValue: slot.name,
    confirmText: '保存',
  })
  if (name === null) return
  store.renameSaveSlot(slot.id, name)
}

const deleteSlot = async (slot) => {
  const confirmed = await confirmDialog(`确认删除身份档案“${slot.name}”吗？此操作无法恢复。`, {
    title: '删除身份档案',
    confirmText: '删除',
  })
  if (!confirmed) return
  store.deleteSaveSlot(slot.id)
}

const startImportAsNew = () => {
  importMode.value = { type: 'new', slotId: null }
  fileInput.value?.click()
}

const startOverwriteImport = (slotId) => {
  importMode.value = { type: 'overwrite', slotId }
  fileInput.value?.click()
}

const handleImportFile = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result
    if (typeof content !== 'string') return

    if (importMode.value.type === 'new') {
      const suggested = file.name.replace(/\.json$/i, '')
      store.importSaveAsNewSlot(content, suggested)
    } else if (importMode.value.slotId) {
      store.importSaveData(content, { targetSlotId: importMode.value.slotId })
    }

    event.target.value = ''
  }
  reader.readAsText(file)
}
</script>

<style scoped>
.save-atlas {
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-columns: clamp(250px, 28vw, 420px) minmax(0, 1fr);
  overflow: hidden;
  color: var(--ink-strong);
  background: var(--paper-base);
}

.save-atlas__intro {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(40px, 5vw, 72px);
  overflow: hidden;
  color: #f5f1df;
  background:
    linear-gradient(180deg, rgba(25, 64, 49, 0.7), rgba(16, 47, 39, 0.94)),
    url('@/assets/background/normal_background_day.png') center / cover;
}

.save-atlas__intro::after {
  content: '';
  position: absolute;
  inset: 18px;
  border: 1px solid rgba(245, 241, 223, 0.2);
  pointer-events: none;
}

.save-atlas__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 88px;
  font-size: 14px;
  font-weight: 750;
  letter-spacing: 0.08em;
}
.save-atlas__seal {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-family: Georgia, serif;
}
.save-atlas__intro .paper-label {
  color: #d7dfb7;
}
.save-atlas__intro h1 {
  max-width: 440px;
  margin: 12px 0 24px;
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: clamp(40px, 4.4vw, 66px);
  line-height: 1.12;
  letter-spacing: -0.035em;
}
.save-atlas__lead {
  max-width: 440px;
  color: rgba(245, 241, 223, 0.8);
  font-size: 16px;
  line-height: 1.9;
}
.save-atlas__note {
  position: relative;
  z-index: 1;
  max-width: 390px;
  padding-top: 18px;
  border-top: 1px solid rgba(245, 241, 223, 0.28);
}
.save-atlas__note strong {
  font-size: 13px;
  letter-spacing: 0.08em;
}
.save-atlas__note p {
  margin: 8px 0 10px;
  color: rgba(245, 241, 223, 0.76);
  font-size: 13px;
  line-height: 1.7;
}
.save-atlas__note small {
  color: rgba(245, 241, 223, 0.52);
}

.save-atlas__main {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 96% 0%, var(--sage-wash), transparent 34%), var(--paper-base);
}
.save-atlas__content {
  width: min(960px, calc(100% - 64px));
  margin: 0 auto;
  padding: 54px 0 64px;
}
.save-atlas__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 28px;
}
.save-atlas__header > div:first-child {
  min-width: 0;
  flex: 1 1 300px;
}
.save-atlas__header h2 {
  margin: 8px 0 5px;
}
.save-atlas__header p:last-child {
  color: var(--ink-muted);
  font-size: 14px;
}
.save-atlas__header-actions {
  display: flex;
  gap: 10px;
}
.save-atlas__storage-note {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 28px 0 20px;
  padding: 12px 16px;
  border-block: 1px solid var(--line-soft);
  color: var(--ink-muted);
  font-size: 13px;
}
.save-atlas__storage-note span {
  padding: 3px 7px;
  border-radius: 3px;
  color: var(--forest-700);
  background: var(--sage-wash);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.save-atlas__devtools {
  margin-bottom: 20px;
}
.save-atlas__empty {
  display: grid;
  place-items: center;
  min-height: 340px;
  padding: 50px;
  text-align: center;
}
.save-atlas__empty-mark {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--forest-700);
  font-size: 28px;
}
.save-atlas__empty h3 {
  margin-top: 18px;
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: 26px;
}
.save-atlas__empty p {
  margin: 8px 0 22px;
  color: var(--ink-muted);
}
.save-atlas__empty div {
  display: flex;
  gap: 10px;
}
.save-atlas__list {
  display: grid;
  gap: 12px;
}

.save-card {
  position: relative;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 240px;
  gap: 18px;
  align-items: center;
  padding: 20px;
  overflow: hidden;
}
.save-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: transparent;
}
.save-card--recent::before {
  background: var(--forest-600);
}
.save-card__index {
  align-self: stretch;
  display: grid;
  place-items: start center;
  padding-top: 4px;
  border-right: 1px solid var(--line-soft);
  color: var(--ink-faint);
  font-family: Georgia, serif;
  font-size: 18px;
}
.save-card__meta {
  display: flex;
  gap: 7px;
  margin-bottom: 7px;
  color: var(--forest-700);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.save-card__body {
  min-width: 0;
}
.save-card__meta span {
  padding: 2px 6px;
  background: var(--sage-wash);
  border-radius: 3px;
}
.save-card h3 {
  margin: 0 0 13px;
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: 24px;
}
.save-card__stats {
  display: flex;
  gap: 24px;
  margin: 0;
}
.save-card__stats div {
  min-width: 58px;
}
.save-card__stats dt {
  color: var(--ink-faint);
  font-size: 11px;
}
.save-card__stats dd {
  margin: 3px 0 0;
  color: var(--ink-strong);
  font-weight: 800;
}
.save-card__date {
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 11px;
}
.save-card__actions {
  display: grid;
  gap: 9px;
}
.save-card__secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.save-card__secondary button {
  min-height: 30px;
  padding: 5px 8px;
  font-size: 11px;
}

@media (max-width: 1240px) {
  .save-atlas {
    grid-template-columns: 250px minmax(0, 1fr);
  }
  .save-atlas__intro {
    padding: 40px 34px;
  }
  .save-atlas__brand {
    margin-bottom: 64px;
  }
  .save-atlas__content {
    width: calc(100% - 40px);
    padding-top: 38px;
  }
  .save-card {
    grid-template-columns: 40px minmax(0, 1fr) 198px;
  }
  .save-card__stats {
    gap: 14px;
  }
}

@media (max-width: 980px) {
  .save-atlas {
    grid-template-columns: 220px minmax(0, 1fr);
  }
  .save-atlas__intro {
    padding: 30px 24px;
  }
  .save-atlas__brand {
    margin-bottom: 44px;
  }
  .save-atlas__intro h1 {
    font-size: 34px;
  }
  .save-atlas__lead {
    font-size: 13px;
  }
  .save-atlas__content {
    width: calc(100% - 24px);
    padding-top: 28px;
  }
  .save-atlas__header {
    align-items: flex-start;
    gap: 14px;
  }
  .save-card {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 12px;
    padding: 16px;
  }
  .save-card__actions {
    grid-column: 2;
  }
  .save-card__stats {
    flex-wrap: wrap;
  }
}

@media (max-height: 680px) {
  .save-atlas__brand {
    margin-bottom: 38px;
  }
  .save-atlas__note {
    display: none;
  }
}
</style>
