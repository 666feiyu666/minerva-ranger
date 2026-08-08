import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { alertDialog } from '@/composables/dialogService'
import {
  PREVIEW_BACKGROUND_ITEMS,
  PREVIEW_SKILL_ITEMS,
  SHOP_CATEGORIES,
} from '@/config/shopCatalog'
import { TREE_TYPES } from '@/config/treeCatalog'
import { getGlobalLevelFromXP } from '@/local-backend/domain/leveling'
import {
  buildShopCatalog,
  buildShopItems,
  canPurchaseShopItem as canPurchaseCatalogItem,
  ownsShopItem as ownsCatalogItem,
} from '@/local-backend/services/shopService'

export const usePlayerStore = defineStore('player', () => {
  const coins = ref(0)
  const unlockedTreeIds = ref(['t1'])
  const ownedBoostIds = ref([])
  const unlockedBackgroundIds = ref(['background_default'])
  const globalXP = ref(0)

  const globalLevel = computed(() => getGlobalLevelFromXP(globalXP.value))
  const globalLevelProgress = computed(() => {
    const level = globalLevel.value
    const currentBaseXP = 100 * Math.pow(level - 1, 2)
    const nextLevelXP = 100 * Math.pow(level, 2)
    const needed = nextLevelXP - currentBaseXP
    const current = globalXP.value - currentBaseXP
    return needed === 0 ? 0 : Math.min((current / needed) * 100, 100)
  })
  const inventoryTrees = computed(() =>
    TREE_TYPES.filter((tree) => unlockedTreeIds.value.includes(tree.id)),
  )
  const shopItems = computed(() =>
    buildShopItems({
      treeTypes: TREE_TYPES,
      previewSkillItems: PREVIEW_SKILL_ITEMS,
      previewBackgroundItems: PREVIEW_BACKGROUND_ITEMS,
    }),
  )
  const shopCatalog = computed(() => buildShopCatalog(SHOP_CATEGORIES, shopItems.value))

  function getShopOwnershipContext() {
    return {
      unlockedTreeIds: unlockedTreeIds.value,
      ownedBoostIds: ownedBoostIds.value,
      unlockedBackgroundIds: unlockedBackgroundIds.value,
      globalLevel: globalLevel.value,
      coins: coins.value,
    }
  }

  function ownsShopItem(item) {
    return ownsCatalogItem(item, getShopOwnershipContext())
  }

  function canPurchaseShopItem(item) {
    return canPurchaseCatalogItem(item, getShopOwnershipContext())
  }

  function addCoins(amount) {
    coins.value += Math.max(0, Number(amount) || 0)
  }

  function removeCoins(amount) {
    coins.value = Math.max(0, coins.value - Math.max(0, Number(amount) || 0))
  }

  function addGlobalXP(amount) {
    globalXP.value += Math.max(0, Number(amount) || 0)
  }

  function buyTree(tree) {
    if (!tree || unlockedTreeIds.value.includes(tree.id)) return
    if (coins.value >= tree.price) {
      coins.value -= tree.price
      unlockedTreeIds.value.push(tree.id)
    }
  }

  function purchaseShopItem(item) {
    if (!item) return false
    if (item.type === 'tree') {
      const tree = TREE_TYPES.find((treeItem) => treeItem.id === item.productId)
      if (!tree || !canPurchaseShopItem(item)) return false
      buyTree(tree)
      return true
    }

    if (item.availability !== 'available') {
      void alertDialog('该内容暂未开放。', { title: '暂不可用' })
      return false
    }

    if (!canPurchaseShopItem(item)) return false
    coins.value -= item.price || 0
    if (item.type === 'boost') ownedBoostIds.value.push(item.id)
    if (item.type === 'background') unlockedBackgroundIds.value.push(item.id)
    return true
  }

  function getTreeIcon(id) {
    return TREE_TYPES.find((tree) => tree.id === id)?.icon || '❓'
  }

  function cheatAddCoins() {
    coins.value += 1000
    globalXP.value += 1000
  }

  function hydratePlayerState(data = {}) {
    coins.value = data.coins || 0
    globalXP.value = data.globalXP || 0
    unlockedTreeIds.value = data.unlockedTreeIds || ['t1']
    ownedBoostIds.value = data.ownedBoostIds || []
    unlockedBackgroundIds.value = data.unlockedBackgroundIds || ['background_default']
  }

  function resetPlayerState() {
    coins.value = 0
    globalXP.value = 0
    unlockedTreeIds.value = ['t1']
    ownedBoostIds.value = []
    unlockedBackgroundIds.value = ['background_default']
  }

  function toPlayerSnapshot() {
    return {
      coins: coins.value,
      globalXP: globalXP.value,
      unlockedTreeIds: unlockedTreeIds.value,
      ownedBoostIds: ownedBoostIds.value,
      unlockedBackgroundIds: unlockedBackgroundIds.value,
    }
  }

  return {
    coins,
    globalXP,
    unlockedTreeIds,
    ownedBoostIds,
    unlockedBackgroundIds,
    globalLevel,
    globalLevelProgress,
    inventoryTrees,
    shopItems,
    shopCatalog,
    TREE_TYPES,
    SHOP_CATEGORIES,
    ownsShopItem,
    canPurchaseShopItem,
    addCoins,
    removeCoins,
    addGlobalXP,
    buyTree,
    purchaseShopItem,
    getTreeIcon,
    cheatAddCoins,
    hydratePlayerState,
    resetPlayerState,
    toPlayerSnapshot,
  }
})
