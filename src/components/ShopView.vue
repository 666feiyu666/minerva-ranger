<template>
  <div class="nursery-page subtle-scrollbar">
    <header class="nursery-header paper-panel">
      <div>
        <p class="paper-label">培育补给</p>
        <h2 class="display-title">巡林苗圃</h2>
        <p>挑选适合当前阶段的树种与物件，让每次行动留下不同的生长痕迹。</p>
      </div>
      <dl class="nursery-summary">
        <div>
          <dt>可用金币</dt>
          <dd>{{ Math.floor(store.coins) }}</dd>
        </div>
        <div>
          <dt>已收录树种</dt>
          <dd>{{ store.inventoryTrees.length }}</dd>
        </div>
      </dl>
    </header>

    <nav class="nursery-tabs" aria-label="苗圃分类">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="{ 'is-active': selectedCategoryId === category.id }"
        @click="selectedCategoryId = category.id"
      >
        {{ category.name }} <span>{{ category.items.length }}</span>
      </button>
    </nav>

    <section v-if="selectedCategory" class="nursery-catalog paper-panel">
      <header class="nursery-catalog__header">
        <div>
          <p class="paper-label">{{ selectedCategory.eyebrow }}</p>
          <h3>{{ selectedCategory.name }}</h3>
          <p>{{ selectedCategory.desc }}</p>
        </div>
        <span>{{ selectedCategory.items.length }} 件可查看</span>
      </header>

      <div class="nursery-grid">
        <article
          v-for="item in selectedCategory.items"
          :key="item.id"
          class="nursery-card"
          :class="{ 'nursery-card--preview': item.availability === 'preview' }"
        >
          <div class="nursery-card__visual">
            <img v-if="item.icon" :src="item.icon" class="pixel-art" :alt="item.name" />
            <span v-else aria-hidden="true">{{ item.iconEmoji || '·' }}</span>
          </div>

          <div class="nursery-card__body">
            <div class="nursery-card__heading">
              <span class="nursery-card__badge">{{ item.badge }}</span>
              <span>Lv. {{ item.levelReq }}</span>
            </div>
            <h4>{{ item.name }}</h4>
            <p>{{ item.desc }}</p>

            <dl class="nursery-card__meta">
              <div v-for="meta in item.meta" :key="`${item.id}-${meta.label}`">
                <dt>{{ meta.label }}</dt>
                <dd>{{ meta.value }}</dd>
              </div>
            </dl>

            <footer>
              <div>
                <small>所需金币</small><strong>{{ item.price }}</strong>
              </div>
              <button
                :disabled="!store.canPurchaseShopItem(item)"
                @click="store.purchaseShopItem(item)"
              >
                {{ buttonLabel(item) }}
              </button>
            </footer>
          </div>
        </article>
      </div>
    </section>

    <section v-else class="nursery-empty paper-panel">当前没有可查看的苗圃内容。</section>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { useAppStore } from '@/stores/appStore'
import { usePlayerStore } from '@/stores/playerStore'

const appStore = useAppStore()
const playerStore = usePlayerStore()
const store = reactive({
  ...storeToRefs(appStore),
  ...storeToRefs(playerStore),
  ownsShopItem: playerStore.ownsShopItem,
  canPurchaseShopItem: playerStore.canPurchaseShopItem,
  purchaseShopItem: playerStore.purchaseShopItem,
})
const selectedCategoryId = ref(null)
const categories = computed(() => store.shopCatalog)

watch(
  categories,
  (nextCategories) => {
    if (!nextCategories.length) {
      selectedCategoryId.value = null
      return
    }
    if (!nextCategories.some((category) => category.id === selectedCategoryId.value)) {
      selectedCategoryId.value = nextCategories[0].id
    }
  },
  { immediate: true },
)

const selectedCategory = computed(
  () => categories.value.find((category) => category.id === selectedCategoryId.value) || null,
)

const buttonLabel = (item) => {
  if (store.ownsShopItem(item)) return '已收录'
  if (item.availability === 'preview') return '暂未开放'
  if (store.globalLevel < item.levelReq) return '等级不足'
  if (store.coins < item.price) return '金币不足'
  return item.type === 'tree' ? '收录树种' : '购买'
}
</script>

<style scoped>
.nursery-page {
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 24px clamp(24px, 3vw, 42px) 56px;
  color: var(--ink-strong);
  background: radial-gradient(circle at 90% 0%, var(--sage-wash), transparent 28%);
}
.nursery-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 24px 28px;
}
.nursery-header > div:first-child {
  min-width: 0;
  flex: 1;
}
.nursery-header h2 {
  margin: 7px 0 6px;
}
.nursery-header > div > p:last-child {
  max-width: 650px;
  color: var(--ink-muted);
  font-size: 14px;
  line-height: 1.7;
}
.nursery-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(110px, 1fr));
  min-width: 0;
  flex: 0 1 320px;
  margin: 0;
  border-left: 1px solid var(--line-soft);
}
.nursery-summary div {
  padding: 3px 20px;
}
.nursery-summary dt {
  color: var(--ink-faint);
  font-size: 11px;
}
.nursery-summary dd {
  margin: 3px 0 0;
  color: var(--forest-700);
  font-family: Georgia, serif;
  font-size: 26px;
  font-weight: 750;
}
.nursery-tabs {
  display: flex;
  gap: 6px;
  margin: 14px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line-soft);
}
.nursery-tabs button {
  min-height: 34px;
  padding: 6px 13px;
  border: 1px solid transparent;
  border-radius: 5px;
  color: var(--ink-muted);
  font-size: 13px;
  font-weight: 750;
  transition: 140ms ease;
}
.nursery-tabs button:hover {
  color: var(--forest-700);
  background: var(--paper-raised);
}
.nursery-tabs button.is-active {
  color: var(--paper-raised);
  background: var(--forest-700);
}
.nursery-tabs span {
  margin-left: 5px;
  opacity: 0.65;
  font-size: 11px;
}
.nursery-catalog {
  overflow: hidden;
}
.nursery-catalog__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line-soft);
  background: var(--paper-muted);
}
.nursery-catalog__header h3 {
  margin: 4px 0 3px;
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: 22px;
}
.nursery-catalog__header p:last-child {
  color: var(--ink-muted);
  font-size: 13px;
}
.nursery-catalog__header > span {
  color: var(--ink-faint);
  font-size: 12px;
}
.nursery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}
.nursery-card {
  min-height: 234px;
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  overflow: hidden;
  background: var(--paper-raised);
  transition: 150ms ease;
}
.nursery-card:hover {
  border-color: var(--line-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}
.nursery-card--preview {
  background: color-mix(in srgb, var(--amber-wash) 52%, var(--paper-raised));
}
.nursery-card__visual {
  display: grid;
  place-items: center;
  padding: 18px;
  border-right: 1px solid var(--line-soft);
  background: var(--paper-muted);
}
.nursery-card__visual img {
  width: 76px;
  height: 94px;
  object-fit: contain;
}
.nursery-card__visual span {
  color: var(--forest-700);
  font-family: Georgia, serif;
  font-size: 34px;
}
.nursery-card__body {
  display: flex;
  flex-direction: column;
  padding: 16px;
}
.nursery-card__heading {
  display: flex;
  justify-content: space-between;
  color: var(--ink-faint);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.nursery-card__badge {
  color: var(--forest-700);
}
.nursery-card h4 {
  margin: 7px 0 4px;
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: 19px;
}
.nursery-card__body > p {
  min-height: 38px;
  color: var(--ink-muted);
  font-size: 12px;
  line-height: 1.55;
}
.nursery-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin: 10px 0 12px;
}
.nursery-card__meta div {
  padding: 6px 8px;
  border-left: 2px solid var(--sage-300);
  background: var(--paper-muted);
}
.nursery-card__meta dt {
  color: var(--ink-faint);
  font-size: 9px;
}
.nursery-card__meta dd {
  margin: 2px 0 0;
  font-size: 11px;
  font-weight: 700;
}
.nursery-card footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
}
.nursery-card footer div {
  display: grid;
}
.nursery-card footer small {
  color: var(--ink-faint);
  font-size: 9px;
}
.nursery-card footer strong {
  color: var(--amber-700);
  font-family: Georgia, serif;
  font-size: 18px;
}
.nursery-card footer button {
  min-height: 32px;
  padding: 6px 12px;
  border-radius: 5px;
  color: white;
  background: var(--forest-700);
  font-size: 11px;
  font-weight: 800;
}
.nursery-card footer button:disabled {
  color: var(--ink-faint);
  background: var(--paper-muted);
  cursor: not-allowed;
}
.nursery-empty {
  display: grid;
  min-height: 280px;
  place-items: center;
  color: var(--ink-muted);
}
@media (min-width: 1540px) {
  .nursery-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 1160px) {
  .nursery-header {
    align-items: flex-start;
  }
  .nursery-summary {
    min-width: 230px;
  }
  .nursery-card {
    grid-template-columns: 88px minmax(0, 1fr);
  }
  .nursery-card__visual img {
    width: 58px;
  }
}

@media (max-width: 980px) {
  .nursery-page {
    padding: 16px 16px 42px;
  }

  .nursery-header {
    flex-direction: column;
    gap: 18px;
    padding: 20px;
  }

  .nursery-summary {
    width: 100%;
    flex-basis: auto;
    border-top: 1px solid var(--line-soft);
    border-left: 0;
    padding-top: 14px;
  }

  .nursery-summary div {
    padding-inline: 0;
  }

  .nursery-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-height: 680px) {
  .nursery-page {
    padding-top: 14px;
  }

  .nursery-header {
    padding-block: 16px;
  }
}
</style>
