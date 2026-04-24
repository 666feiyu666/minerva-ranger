<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="shrink-0 p-6 pb-3">
      <section
        class="rounded-[2rem] border p-6 shadow-2xl backdrop-blur-md transition-colors"
        :class="
          store.isNightMode
            ? 'border-[#355140] bg-[#101915]/90 text-white'
            : 'border-[#cfd9cc] bg-[#f7fbf4]/90 text-gray-800'
        "
      >
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div class="max-w-3xl">
            <div
              class="text-xs uppercase tracking-[0.28em] font-bold"
              :class="store.isNightMode ? 'text-emerald-200/60' : 'text-[#6f826d]'"
            >
              Ranger Supply
            </div>
            <h2 class="mt-3 text-3xl font-black tracking-wide">巡林补给商店</h2>
            <p
              class="mt-3 text-sm leading-7"
              :class="store.isNightMode ? 'text-gray-300' : 'text-[#5e6d5c]'"
            >
              选择树种，扩充你的森林。
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 xl:min-w-[21rem]">
            <div
              class="rounded-2xl border px-4 py-4"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/25'
                  : 'border-white/70 bg-white/70'
              "
            >
              <div
                class="text-[11px] uppercase tracking-[0.22em] font-bold"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                Current Funds
              </div>
              <div class="mt-2 text-3xl font-black text-yellow-500">
                🪙 {{ Math.floor(store.coins) }}
              </div>
            </div>

            <div
              class="rounded-2xl border px-4 py-4"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/25'
                  : 'border-white/70 bg-white/70'
              "
            >
              <div
                class="text-[11px] uppercase tracking-[0.22em] font-bold"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                Collected
              </div>
              <div class="mt-2 text-3xl font-black">
                {{ store.inventoryTrees.length }}
              </div>
              <div
                class="mt-1 text-xs"
                :class="store.isNightMode ? 'text-gray-400' : 'text-[#657463]'"
              >
                已收录树种
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="shrink-0 px-6 pb-3">
      <div class="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectedCategoryId = category.id"
          class="shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-all"
          :class="categoryTabClass(category.id)"
        >
          {{ category.name }}
          <span class="ml-2 opacity-70">{{ category.items.length }}</span>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
      <section
        v-if="selectedCategory"
        class="rounded-[2rem] border shadow-2xl overflow-hidden"
        :class="
          store.isNightMode
            ? 'border-[#355140] bg-[#111915]/90'
            : 'border-[#d5ddd1] bg-[#f8fbf5]/90'
        "
      >
        <div
          class="border-b px-6 py-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
          :class="
            store.isNightMode
              ? 'border-white/10 bg-black/20'
              : 'border-[#dee6db] bg-white/55'
          "
        >
          <div>
            <div
              class="text-[11px] uppercase tracking-[0.24em] font-bold"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              {{ selectedCategory.eyebrow }}
            </div>
            <h3 class="mt-2 text-2xl font-black">{{ selectedCategory.name }}</h3>
            <p
              class="mt-2 text-sm"
              :class="store.isNightMode ? 'text-gray-300' : 'text-[#60705f]'"
            >
              {{ selectedCategory.desc }}
            </p>
          </div>

          <span
            class="rounded-full border px-3 py-1.5 text-xs font-bold"
            :class="
              store.isNightMode
                ? 'border-white/10 bg-black/25 text-emerald-200'
                : 'border-white/70 bg-white/80 text-[#4f6650]'
            "
          >
            {{ selectedCategory.items.length }} 件在售
          </span>
        </div>

        <div class="grid gap-5 p-6 md:grid-cols-2 2xl:grid-cols-3">
          <article
            v-for="item in selectedCategory.items"
            :key="item.id"
            class="rounded-[1.75rem] border p-5 transition-all duration-300 hover:-translate-y-1"
            :class="cardClass(item)"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <span
                  class="rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                  :class="badgeClass(item)"
                >
                  {{ item.badge }}
                </span>
                <h4 class="mt-3 text-xl font-black">{{ item.name }}</h4>
                <p
                  class="mt-2 text-sm leading-6"
                  :class="store.isNightMode ? 'text-gray-300' : 'text-[#5e6d5c]'"
                >
                  {{ item.desc }}
                </p>
              </div>

              <div
                class="w-16 h-16 shrink-0 rounded-2xl border flex items-center justify-center overflow-hidden"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/25'
                    : 'border-white/70 bg-white/80'
                "
              >
                <img
                  v-if="item.icon"
                  :src="item.icon"
                  class="w-12 h-12 object-contain pixel-art"
                  alt="shop item"
                />
                <span v-else class="text-3xl">{{ item.iconEmoji || '🧺' }}</span>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-2">
              <div
                v-for="meta in item.meta"
                :key="`${item.id}-${meta.label}`"
                class="rounded-2xl border px-3 py-3"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/20'
                    : 'border-[#dbe3d7] bg-white/70'
                "
              >
                <div
                  class="text-[11px] uppercase tracking-[0.2em] font-bold"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  {{ meta.label }}
                </div>
                <div class="mt-1 text-sm font-bold">{{ meta.value }}</div>
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between gap-3">
              <div>
                <div
                  class="text-[11px] uppercase tracking-[0.2em] font-bold"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  Price
                </div>
                <div class="mt-1 text-lg font-black text-yellow-500">
                  🪙 {{ item.price }}
                </div>
              </div>

              <div
                class="rounded-full border px-3 py-1.5 text-xs font-bold"
                :class="
                  store.globalLevel >= item.levelReq
                    ? store.isNightMode
                      ? 'border-emerald-800 bg-emerald-900/20 text-emerald-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : store.isNightMode
                      ? 'border-red-900 bg-red-900/20 text-red-300'
                      : 'border-red-200 bg-red-50 text-red-600'
                "
              >
                Lv.{{ item.levelReq }}
              </div>
            </div>

            <button
              @click="store.purchaseShopItem(item)"
              :disabled="!store.canPurchaseShopItem(item)"
              class="mt-5 w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all"
              :class="buttonClass(item)"
            >
              {{ buttonLabel(item) }}
            </button>
          </article>
        </div>
      </section>

      <section
        v-else
        class="rounded-[2rem] border px-6 py-16 text-center shadow-2xl"
        :class="
          store.isNightMode
            ? 'border-[#355140] bg-[#111915]/90 text-gray-300'
            : 'border-[#d5ddd1] bg-[#f8fbf5]/90 text-[#60705f]'
        "
      >
        当前没有可购买内容。
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()
const selectedCategoryId = ref(null)

const categories = computed(() => store.shopCatalog)

watch(
  categories,
  nextCategories => {
    if (!nextCategories.length) {
      selectedCategoryId.value = null
      return
    }

    if (!nextCategories.some(category => category.id === selectedCategoryId.value)) {
      selectedCategoryId.value = nextCategories[0].id
    }
  },
  { immediate: true }
)

const selectedCategory = computed(
  () => categories.value.find(category => category.id === selectedCategoryId.value) || null
)

const categoryTabClass = categoryId => {
  if (selectedCategoryId.value === categoryId) {
    return store.isNightMode
      ? 'border-emerald-700 bg-emerald-900/30 text-white shadow-[0_0_30px_rgba(16,185,129,0.08)]'
      : 'border-emerald-300 bg-emerald-50 text-gray-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]'
  }

  return store.isNightMode
    ? 'border-white/10 bg-black/20 text-gray-300 hover:bg-black/30'
    : 'border-white/70 bg-white/70 text-gray-700 hover:bg-white'
}

const badgeClass = item => {
  if (item.availability === 'preview') {
    return store.isNightMode
      ? 'border-amber-800 bg-amber-900/20 text-amber-300'
      : 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return store.isNightMode
    ? 'border-emerald-800 bg-emerald-900/20 text-emerald-300'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

const cardClass = item => {
  if (item.availability === 'preview') {
    return store.isNightMode
      ? 'border-[#4d4122] bg-[#1b1710] text-white'
      : 'border-[#e8d8b0] bg-[#fff9ec] text-gray-800'
  }

  return store.isNightMode
    ? 'border-white/10 bg-[#141c18] text-white hover:border-emerald-800'
    : 'border-white/80 bg-white/85 text-gray-800 hover:border-emerald-200'
}

const buttonLabel = item => {
  if (store.ownsShopItem(item)) return '已收录'
  if (item.availability === 'preview') return '暂未开放'
  if (store.globalLevel < item.levelReq) return '等级不足'
  if (store.coins < item.price) return '金币不足'
  return item.type === 'tree' ? '购买树种' : '购买'
}

const buttonClass = item => {
  if (store.ownsShopItem(item)) {
    return store.isNightMode
      ? 'border border-white/10 bg-black/25 text-gray-500 cursor-not-allowed'
      : 'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
  }

  if (item.availability === 'preview') {
    return store.isNightMode
      ? 'border border-amber-900 bg-amber-900/15 text-amber-300 cursor-not-allowed'
      : 'border border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed'
  }

  if (store.globalLevel < item.levelReq || store.coins < item.price) {
    return store.isNightMode
      ? 'border border-white/10 bg-black/25 text-gray-500 cursor-not-allowed'
      : 'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
  }

  return 'bg-gradient-to-r from-emerald-700 to-lime-700 text-white hover:from-emerald-600 hover:to-lime-600 shadow-[0_18px_40px_rgba(20,83,45,0.25)] active:scale-[0.99]'
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>
