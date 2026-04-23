<template>
  <div class="min-h-screen w-full flex bg-[#0b1220] text-white overflow-hidden">
    <aside
      class="hidden lg:flex w-[28rem] flex-col justify-between border-r border-white/10 bg-[linear-gradient(180deg,rgba(7,18,35,0.95),rgba(8,25,26,0.92))] p-10"
    >
      <div>
        <div class="text-sm uppercase tracking-[0.35em] text-emerald-300/80 mb-6">
          Minerva Ranger
        </div>
        <h1 class="text-5xl font-black leading-tight text-white mb-6">
          选择你的巡林档案
        </h1>
        <p class="text-lg leading-8 text-slate-300 max-w-md">
          每一份存档都是一片独立的知识森林。你可以保留现有世界，也可以开启一片全新的主题与项目地形。
        </p>
      </div>

      <div class="space-y-4">
        <div class="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div class="text-sm font-bold text-emerald-200 mb-2">推荐用法</div>
          <p class="text-sm leading-7 text-emerald-50/90">
            主档案用于日常使用，实验性主题、新论文结构或新工作流建议单独开一个新存档。
          </p>
        </div>
        <div class="text-xs text-slate-500">本地多存档已启用，后续可继续扩展云端槽位。</div>
      </div>
    </aside>

    <main class="flex-1 relative overflow-y-auto">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_25%)]"></div>
      <div class="relative max-w-6xl mx-auto px-6 py-10 lg:px-10">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div class="text-sm uppercase tracking-[0.3em] text-emerald-300/80 mb-2">
              Save Slots
            </div>
            <h2 class="text-4xl font-black text-white mb-2">选择要进入的存档</h2>
            <p class="text-slate-300">
              当前共有 {{ store.saveSlots.length }} 个本地存档位。
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              @click="createSlot"
              class="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
            >
              + 新建存档
            </button>
            <button
              @click="startImportAsNew"
              class="px-5 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
            >
              导入为新存档
            </button>
          </div>
        </div>

        <div v-if="store.saveSlots.length === 0" class="rounded-[2rem] border border-dashed border-white/15 bg-black/20 p-10 text-center">
          <div class="text-5xl mb-4">🌲</div>
          <h3 class="text-2xl font-bold mb-3">还没有可用存档</h3>
          <p class="text-slate-300 mb-6">可以先创建一份全新存档，或把已有 JSON 存档导入成新的档案槽位。</p>
          <div class="flex justify-center gap-3">
            <button
              @click="createSlot"
              class="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
            >
              创建第一份存档
            </button>
            <button
              @click="startImportAsNew"
              class="px-5 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
            >
              导入现有存档
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
                  <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/10 text-slate-200 border border-white/10">
                    本地存档
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
                    <div class="text-lg font-bold text-white">Lv. {{ slot.summary.globalLevel }}</div>
                  </div>
                  <div class="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">主题</div>
                    <div class="text-lg font-bold text-white">{{ slot.summary.themeCount }}</div>
                  </div>
                  <div class="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">项目</div>
                    <div class="text-lg font-bold text-white">{{ slot.summary.projectCount }}</div>
                  </div>
                  <div class="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <div class="text-xs uppercase tracking-wide text-slate-400 mb-1">日志</div>
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
                  进入存档
                </button>
                <div class="grid grid-cols-2 gap-3">
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

      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleImportFile"
      />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const fileInput = ref(null)
const importMode = ref({ type: 'new', slotId: null })

const formatDate = value => {
  if (!value) return '未进入过'
  return new Date(value).toLocaleString()
}

const createSlot = () => {
  const name = window.prompt('请输入新存档名称', `新存档 #${store.saveSlots.length + 1}`)
  if (name === null) return
  const slotId = store.createSaveSlot(name)
  if (slotId) store.enterSlot(slotId)
}

const renameSlot = slot => {
  const name = window.prompt('请输入新的存档名称', slot.name)
  if (name === null) return
  store.renameSaveSlot(slot.id, name)
}

const deleteSlot = slot => {
  const confirmed = window.confirm(`确认删除存档 "${slot.name}" 吗？该操作不可恢复。`)
  if (!confirmed) return
  store.deleteSaveSlot(slot.id)
}

const startImportAsNew = () => {
  importMode.value = { type: 'new', slotId: null }
  fileInput.value?.click()
}

const startOverwriteImport = slotId => {
  importMode.value = { type: 'overwrite', slotId }
  fileInput.value?.click()
}

const handleImportFile = event => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = e => {
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
