<template>
  <div class="min-h-screen w-full flex bg-[#0b1220] text-white overflow-hidden">
    <aside
      class="hidden lg:flex w-[28rem] flex-col justify-between border-r border-white/10 bg-[linear-gradient(180deg,rgba(7,18,35,0.95),rgba(8,25,26,0.92))] p-10"
    >
      <div>
        <div class="text-sm uppercase tracking-[0.35em] text-emerald-300/80 mb-6">
          Minerva Ranger
        </div>
        <h1 class="text-5xl font-black leading-tight text-white mb-6">选择你的身份档案</h1>
        <p class="text-lg leading-8 text-slate-300 max-w-md">
          每份身份档案代表一个长期身份。进入后，通过技能组织你反复实践的行动。
        </p>
      </div>

      <div class="space-y-4">
        <div class="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div class="text-sm font-bold text-emerald-200 mb-2">推荐用法</div>
          <p class="text-sm leading-7 text-emerald-50/90">
            为不同的长期身份建立独立档案，例如“开发设计师”或“人类学家”。
          </p>
        </div>
        <div class="text-xs text-slate-500">身份档案仍保存在本地，不依赖账号或网络。</div>
      </div>
    </aside>

    <main class="flex-1 relative overflow-y-auto">
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_25%)]"
      ></div>
      <div class="relative max-w-6xl mx-auto px-6 py-10 lg:px-10">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div class="text-sm uppercase tracking-[0.3em] text-emerald-300/80 mb-2">
              Identity Profiles
            </div>
            <h2 class="text-4xl font-black text-white mb-2">选择要进入的身份档案</h2>
            <p class="text-slate-300">当前共有 {{ store.saveSlots.length }} 个身份档案。</p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              @click="createSlot"
              class="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
            >
              + 新建身份档案
            </button>
            <button
              @click="startImportAsNew"
              class="px-5 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
            >
              导入为新身份档案
            </button>
          </div>
        </div>

        <section
          class="mb-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-50/90 backdrop-blur-md"
        >
          <div class="font-bold text-emerald-200">本地身份档案</div>
          <p class="mt-2 leading-6">
            所有档案保存在当前设备的 localStorage 中。请定期使用导出功能保留独立 JSON 备份。
          </p>
        </section>

        <component :is="DevToolsPanel" v-if="DevToolsPanel" class="mb-8" />

        <div
          v-if="store.saveSlots.length === 0"
          class="rounded-[2rem] border border-dashed border-white/15 bg-black/20 p-10 text-center"
        >
          <div class="text-5xl mb-4">🌲</div>
          <h3 class="text-2xl font-bold mb-3">还没有身份档案</h3>
          <p class="text-slate-300 mb-6">可以先创建“开发设计师”身份档案，或导入已有 JSON 档案。</p>
          <div class="flex justify-center gap-3">
            <button
              @click="createSlot"
              class="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
            >
              创建第一个身份档案
            </button>
            <button
              @click="startImportAsNew"
              class="px-5 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
            >
              导入现有身份档案
            </button>
          </div>
        </div>

        <div v-else class="space-y-5">
          <article
            v-for="slot in store.saveSlots"
            :key="slot.id"
            class="rounded-[2rem] border p-6 shadow-2xl backdrop-blur-md transition-all"
            :class="
              store.activeSlotId === slot.id
                ? 'border-emerald-400/60 bg-emerald-500/10'
                : 'border-white/10 bg-black/20'
            "
          >
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/10 text-slate-200 border border-white/10"
                  >
                    身份档案
                  </span>
                  <span
                    v-if="store.saveIndex.lastSelectedSlotId === slot.id"
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-400/15 text-emerald-200 border border-emerald-400/20"
                  >
                    最近使用
                  </span>
                  <span
                    v-if="store.activeSlotId === slot.id"
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-400/15 text-blue-200 border border-blue-400/20"
                  >
                    当前激活
                  </span>
                </div>

                <h3 class="text-3xl font-black text-white mb-3 break-words">{{ slot.name }}</h3>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div class="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">等级</div>
                    <div class="text-lg font-bold text-white">
                      Lv. {{ slot.summary.globalLevel }}
                    </div>
                  </div>
                  <div class="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">技能</div>
                    <div class="text-lg font-bold text-white">{{ slot.summary.skillCount }}</div>
                  </div>
                  <div class="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">行动</div>
                    <div class="text-lg font-bold text-white">{{ slot.summary.actionCount }}</div>
                  </div>
                  <div class="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">会话记录</div>
                    <div class="text-lg font-bold text-white">{{ slot.summary.noteCount }}</div>
                  </div>
                </div>

                <div class="text-sm text-slate-300">
                  最后游玩：{{ formatDate(slot.lastPlayedAt) }}
                </div>
              </div>

              <div class="w-full lg:w-64 shrink-0 space-y-3">
                <button
                  @click="store.enterSlot(slot.id)"
                  class="w-full px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
                >
                  进入身份档案
                </button>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    @click="store.moveSaveSlot(slot.id, -1)"
                    :disabled="store.saveSlots[0]?.id === slot.id"
                    class="px-4 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors disabled:opacity-30"
                  >
                    ↑ 上移
                  </button>
                  <button
                    @click="store.moveSaveSlot(slot.id, 1)"
                    :disabled="store.saveSlots[store.saveSlots.length - 1]?.id === slot.id"
                    class="px-4 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors disabled:opacity-30"
                  >
                    ↓ 下移
                  </button>
                  <button
                    @click="renameSlot(slot)"
                    class="px-4 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
                  >
                    重命名
                  </button>
                  <button
                    @click="store.downloadSaveFile(slot.id)"
                    class="px-4 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
                  >
                    导出
                  </button>
                  <button
                    @click="startOverwriteImport(slot.id)"
                    class="px-4 py-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 hover:bg-amber-400/20 text-amber-100 text-sm font-semibold transition-colors"
                  >
                    导入覆盖
                  </button>
                  <button
                    @click="deleteSlot(slot)"
                    class="px-4 py-3 rounded-2xl border border-red-400/20 bg-red-400/10 hover:bg-red-400/20 text-red-100 text-sm font-semibold transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
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
  if (!value) return '未进入过'
  return new Date(value).toLocaleString()
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
  const confirmed = await confirmDialog(`确认删除身份档案 "${slot.name}" 吗？该操作不可恢复。`, {
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
