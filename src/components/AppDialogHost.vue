<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="activeDialog"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @keydown.esc.prevent="handleCancel"
      >
        <div
          class="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#10171a]/95 p-6 text-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="dialogTitleId"
        >
          <div class="mb-4">
            <div class="text-xs uppercase tracking-[0.28em] text-emerald-200/70">
              Dialog
            </div>
            <h2 :id="dialogTitleId" class="mt-3 text-2xl font-black">
              {{ activeDialog.title }}
            </h2>
          </div>

          <p class="whitespace-pre-line text-sm leading-7 text-slate-200/90">
            {{ activeDialog.message }}
          </p>

          <div v-if="activeDialog.type === 'prompt'" class="mt-5">
            <input
              ref="promptInput"
              v-model="promptValue"
              type="text"
              class="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none transition-colors focus:border-emerald-300/50"
              :placeholder="activeDialog.placeholder || '请输入内容'"
              @keydown.enter.prevent="handleConfirm"
            />
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              v-if="activeDialog.type !== 'alert'"
              class="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              @click="handleCancel"
            >
              {{ activeDialog.cancelText }}
            </button>
            <button
              class="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400"
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

watch(activeDialog, async dialog => {
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
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>
