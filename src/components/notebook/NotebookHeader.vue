<template>
  <section
    class="rounded-[2rem] border shadow-2xl shrink-0 overflow-hidden transition-colors"
    :class="
      isNightMode
        ? 'bg-[#141914]/95 border-[#33463a] text-white'
        : 'bg-[#faf8f1]/95 border-[#d8d4c6] text-gray-800'
    "
  >
    <div
      class="px-6 py-6 border-b"
      :class="isNightMode ? 'border-white/10 bg-black/15' : 'border-[#e5dfd1] bg-white/60'"
    >
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <div
            class="text-xs uppercase tracking-[0.28em] font-bold"
            :class="isNightMode ? 'text-emerald-200/60' : 'text-[#7a7f72]'"
          >
            Ranger Notes
          </div>
          <h2 class="mt-3 text-3xl font-black tracking-wide">{{ title }}</h2>
          <p
            class="mt-3 text-sm leading-7"
            :class="isNightMode ? 'text-gray-300' : 'text-[#625f55]'"
          >
            {{ description }}
          </p>
        </div>

        <div class="flex flex-col items-start gap-3 xl:items-end">
          <button
            v-if="showBack"
            class="rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
            :class="
              isNightMode
                ? 'border-white/10 bg-black/25 text-gray-300 hover:text-white'
                : 'border-[#ddd5c7] bg-white/80 text-gray-600 hover:text-gray-800'
            "
            @click="$emit('back')"
          >
            ← 返回栏目
          </button>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="crumb in breadcrumbs"
              :key="crumb"
              class="rounded-full border px-3 py-1 text-xs font-bold"
              :class="
                isNightMode
                  ? 'border-white/10 bg-black/25 text-gray-300'
                  : 'border-[#dfd8cb] bg-white/80 text-[#5b6a58]'
              "
            >
              {{ crumb }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  breadcrumbs: { type: Array, default: () => ['栏目'] },
  showBack: { type: Boolean, default: false },
  isNightMode: { type: Boolean, default: false },
})

defineEmits(['back'])
</script>
