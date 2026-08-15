<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="activeDialog" class="dialog-backdrop" @keydown.esc.prevent="handleCancel">
        <div class="app-dialog" role="dialog" aria-modal="true" :aria-labelledby="dialogTitleId">
          <div class="app-dialog__header">
            <div class="paper-label">巡林提示</div>
            <h2 :id="dialogTitleId">
              {{ activeDialog.title }}
            </h2>
          </div>

          <p class="app-dialog__message">
            {{ activeDialog.message }}
          </p>

          <div v-if="activeDialog.type === 'prompt'" class="app-dialog__field">
            <input
              ref="promptInput"
              v-model="promptValue"
              type="text"
              class="ranger-input"
              :placeholder="activeDialog.placeholder || '请输入内容'"
              @keydown.enter.prevent="handleConfirm"
            />
          </div>

          <div class="app-dialog__actions">
            <button v-if="activeDialog.type !== 'alert'" class="quiet-button" @click="handleCancel">
              {{ activeDialog.cancelText }}
            </button>
            <button
              v-for="choice in activeDialog.type === 'choice' ? activeDialog.choices : []"
              :key="choice.value"
              class="quiet-button"
              :class="choice.className || ''"
              @click="resolveDialog(choice.value)"
            >
              {{ choice.label }}
            </button>
            <button
              v-if="activeDialog.type !== 'choice'"
              class="primary-button"
              @click="handleConfirm"
            >
              {{ activeDialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { dialogState, dismissActiveDialog, resolveDialog } from '@/composables/dialogService'

const promptInput = ref(null)
const promptValue = ref('')
const dialogTitleId = 'app-dialog-title'
const activeDialog = computed(() => dialogState.active)

watch(activeDialog, async (dialog) => {
  promptValue.value = dialog?.defaultValue || ''

  if (dialog?.type === 'prompt') {
    await nextTick()
    promptInput.value?.focus()
    promptInput.value?.select()
  }
})

const handleCancel = () => {
  dismissActiveDialog()
}

const handleConfirm = () => {
  if (!activeDialog.value) return

  if (activeDialog.value.type === 'prompt') {
    resolveDialog(promptValue.value)
    return
  }

  resolveDialog(true)
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(17, 24, 19, 0.68);
  backdrop-filter: blur(7px);
}

.app-dialog {
  width: min(100%, 440px);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 24px;
  color: var(--ink);
  background: var(--paper-strong);
  box-shadow: var(--shadow-paper);
}

.app-dialog__header {
  margin-bottom: 14px;
}

.app-dialog__header h2 {
  margin-top: 7px;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 750;
}

.app-dialog__message {
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.75;
  white-space: pre-line;
}

.app-dialog__field {
  margin-top: 18px;
}

.app-dialog .ranger-input {
  width: 100%;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--ink);
  background: var(--paper);
}

.app-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 22px;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>
