<template>
  <section
    class="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 p-5 shadow-2xl backdrop-blur-md"
  >
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <div class="mb-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
          Dev Tools
        </div>
        <h3 class="text-2xl font-black text-white">开发场景装载</h3>
        <div class="mt-2 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
          <span
            class="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-cyan-100"
          >
            {{ modeLabel }}
          </span>
          <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
            {{ store.saveSlots.length }} slots
          </span>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          class="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15"
          @click="openJsonImport"
        >
          📥 Load JSON
        </button>
        <button
          class="rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100 transition-colors hover:bg-red-400/20"
          @click="clearLocalSaves"
        >
          🧹 Clear Local
        </button>
      </div>
    </div>

    <div class="mt-5 grid gap-3 lg:grid-cols-3">
      <article
        v-for="fixture in devSaveFixtures"
        :key="fixture.id"
        class="rounded-2xl border border-white/10 bg-black/20 p-4"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80">
              {{ fixture.tag }}
            </div>
            <div class="truncate text-lg font-black text-white">{{ fixture.name }}</div>
          </div>
        </div>
        <p class="min-h-[3rem] text-sm leading-6 text-slate-300">{{ fixture.summary }}</p>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <button
            class="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-black text-slate-950 transition-colors hover:bg-cyan-300"
            @click="loadFixture(fixture, false)"
          >
            Load
          </button>
          <button
            class="rounded-xl border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-200/20"
            @click="loadFixture(fixture, true)"
          >
            Enter
          </button>
        </div>
      </article>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      class="hidden"
      @change="handleJsonFile"
    />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { alertDialog, confirmDialog } from '@/composables/dialogService'
import { devSaveFixtures } from '@/devtools/saveFixtures'
import { useSaveStore } from '@/stores/saveStore'

const store = useSaveStore()
const fileInput = ref(null)
const modeLabel = `mode:${import.meta.env.MODE}`

const openJsonImport = () => {
  fileInput.value?.click()
}

const importDevSave = (saveData, slotName, shouldEnter = false) => {
  const slotId = store.importSaveAsNewSlot(JSON.stringify(saveData), slotName)
  if (slotId && shouldEnter) store.enterSlot(slotId)
  return slotId
}

const loadFixture = async (fixture, shouldEnter) => {
  const saveData = fixture.createSave()
  const slotId = importDevSave(saveData, saveData.slotName || fixture.name, shouldEnter)
  if (!slotId) return

  if (!shouldEnter) {
    await alertDialog(`Loaded ${fixture.name}`, {
      title: 'Dev Tools',
    })
  }
}

const handleJsonFile = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result
    if (typeof content !== 'string') return

    const suggestedName = `DEV - ${file.name.replace(/\.json$/i, '')}`
    store.importSaveAsNewSlot(content, suggestedName)
    event.target.value = ''
  }
  reader.readAsText(file)
}

const clearLocalSaves = async () => {
  const confirmed = await confirmDialog('Clear all local Minerva save data?', {
    title: 'Dev Tools',
    confirmText: 'Clear',
  })
  if (!confirmed) return

  const slotIds = store.saveSlots.map((slot) => slot.id)
  for (const slotId of slotIds) {
    store.deleteSaveSlot(slotId)
  }

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)
    if (key?.startsWith('minerva_')) localStorage.removeItem(key)
  }

  store.initSaveSystem()
}
</script>
