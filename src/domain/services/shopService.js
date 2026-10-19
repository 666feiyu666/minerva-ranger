export function buildTreeShopItems(treeTypes) {
  return treeTypes.map(tree => ({
    id: `tree_${tree.id}`,
    productId: tree.id,
    type: 'tree',
    categoryId: 'trees',
    name: tree.name,
    desc: tree.desc,
    price: tree.price,
    levelReq: tree.levelReq,
    availability: 'available',
    icon: tree.icon,
    badge: tree.levelReq <= 1 ? '基础树种' : '可购买',
    meta: [
      { label: '成长', value: `${(tree.time / 60).toFixed(0)}m` },
      { label: '收益', value: `${tree.xp} XP` }
    ]
  }))
}

export function buildShopItems({ treeTypes, previewSkillItems, previewBackgroundItems }) {
  return [
    ...buildTreeShopItems(treeTypes),
    ...previewSkillItems,
    ...previewBackgroundItems
  ]
}

export function buildShopCatalog(categories, shopItems) {
  return categories
    .map(category => ({
      ...category,
      items: shopItems.filter(
        item => item.categoryId === category.id && item.availability === 'available'
      )
    }))
    .filter(category => category.items.length > 0)
}

export function ownsShopItem(item, ownership) {
  if (!item) return false
  if (item.type === 'tree') return ownership.unlockedTreeIds.includes(item.productId)
  if (item.type === 'boost') return ownership.ownedBoostIds.includes(item.id)
  if (item.type === 'background') return ownership.unlockedBackgroundIds.includes(item.id)
  return false
}

export function canPurchaseShopItem(item, context) {
  if (!item || item.availability !== 'available') return false
  if (ownsShopItem(item, context)) return false
  if (context.globalLevel < (item.levelReq || 1)) return false
  if (context.coins < (item.price || 0)) return false
  return true
}
