export const SHOP_CATEGORIES = [
  {
    id: 'trees',
    name: '树种',
    eyebrow: '树种目录',
    desc: '选择适合当前阶段的树种。',
  },
  {
    id: 'boosts',
    name: '技能',
    eyebrow: '辅助物件',
    desc: '提升效率的辅助道具。',
  },
  {
    id: 'backgrounds',
    name: '造景',
    eyebrow: '场景陈设',
    desc: '用于行动空间的外观装饰。',
  },
]

export const PREVIEW_SKILL_ITEMS = [
  {
    id: 'boost_double_coins',
    type: 'boost',
    categoryId: 'boosts',
    name: '双倍金币手册',
    desc: '提升日志收益的辅助道具。',
    price: 1200,
    levelReq: 8,
    availability: 'preview',
    iconEmoji: '📘',
    badge: '暂未开放',
    meta: [
      { label: '效果', value: '日志金币 x2' },
      { label: '持续', value: '单次任务周期' },
    ],
  },
  {
    id: 'boost_focus_lens',
    type: 'boost',
    categoryId: 'boosts',
    name: '专注透镜',
    desc: '缩短种植周期的效率道具。',
    price: 2400,
    levelReq: 16,
    availability: 'preview',
    iconEmoji: '🔍',
    badge: '暂未开放',
    meta: [
      { label: '效果', value: '成长时间 -20%' },
      { label: '定位', value: '效率型技能书' },
    ],
  },
]

export const PREVIEW_BACKGROUND_ITEMS = [
  {
    id: 'background_archive_room',
    type: 'background',
    categoryId: 'backgrounds',
    name: '手记温室',
    desc: '适用于单个行动的温室造景。',
    price: 1800,
    levelReq: 10,
    availability: 'preview',
    iconEmoji: '🪟',
    badge: '暂未开放',
    meta: [
      { label: '作用域', value: '单个行动' },
      { label: '气质', value: '记录室 / 温室' },
    ],
  },
  {
    id: 'background_watchtower',
    type: 'background',
    categoryId: 'backgrounds',
    name: '巡林瞭望台',
    desc: '适用于单个行动的瞭望台造景。',
    price: 4200,
    levelReq: 20,
    availability: 'preview',
    iconEmoji: '🗼',
    badge: '暂未开放',
    meta: [
      { label: '作用域', value: '单个行动' },
      { label: '气质', value: '瞭望台 / 野外值守' },
    ],
  },
]
