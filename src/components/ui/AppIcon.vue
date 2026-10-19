<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <component :is="shape.tag" v-for="(shape, index) in shapes" :key="index" v-bind="shape.attrs" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 1.8 },
})

const path = (d) => ({ tag: 'path', attrs: { d } })
const circle = (cx, cy, r, extra = {}) => ({ tag: 'circle', attrs: { cx, cy, r, ...extra } })

/**
 * 单一线宽的线性图标语言：24×24 画布、圆头圆角、currentColor。
 * 与工具栏已有的设置 / 羽毛 / 日月图标保持同一笔画风格。
 */
const ICONS = {
  // 目录与身份
  sapling: [
    path('M12 21v-9'),
    path('M12 16c-2.6 .1 -4.6 -1.3 -5.2 -3.8 2.5 -.3 4.7 .9 5.2 3.8Z'),
    path('M12 12.8c.4 -3 2.5 -4.6 5.2 -4.4 -.2 3 -2.4 4.6 -5.2 4.4Z'),
    path('M9 21h6'),
  ],
  map: [
    path('M9 4.6 3.6 6.9v12.5L9 17.1l6 2.3 5.4-2.3V4.6L15 6.9 9 4.6Z'),
    path('M9 4.6v12.5M15 6.9v12.5'),
  ],
  notebook: [
    path('M6.2 4h11.3A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5H6.2A1.5 1.5 0 0 1 4.7 18.5v-13A1.5 1.5 0 0 1 6.2 4Z'),
    path('M8.6 8.4h7.2M8.6 12h7.2M8.6 15.6h4.4'),
  ],
  tree: [path('M12 3.2 5.6 12h3.5L4.7 18.1h14.6L14.9 12h3.5L12 3.2Z'), path('M12 18.1V21')],
  sprout: [
    path('M12 21v-8.2'),
    path('M12 12.8c-3.4 0-5.9-1.9-6.2-5.4 3.4-.2 5.9 1.6 6.2 5.4Z'),
    path('M12 10.4c.3-3.8 2.8-5.6 6.2-5.4-.3 3.5-2.8 5.4-6.2 5.4Z'),
    path('M8.6 21h6.8'),
  ],
  leaf: [
    path('M20.2 3.8c-9.1.2-14.1 3.8-14.1 9.8 0 2 .8 3.7 2.1 4.8'),
    path('M4.6 20.2c1.9-4.2 5-7 9.6-8.6'),
  ],
  compass: [circle(12, 12, 8.2), path('M15.2 8.8 13.4 13.4 8.8 15.2l1.8-4.6 4.6-1.8Z')],

  // 操作
  pencil: [path('M4 20h4.1L19 9.1a2.1 2.1 0 0 0-3-3L5.1 17 4 20Z'), path('M13.6 6.4 17.6 10.4')],
  trash: [
    path('M4.6 7h14.8'),
    path('M9.2 7V5.6A1.6 1.6 0 0 1 10.8 4h2.4a1.6 1.6 0 0 1 1.6 1.6V7'),
    path('M6.6 7l.8 11.5A1.6 1.6 0 0 0 9 20h6a1.6 1.6 0 0 0 1.6-1.5L17.4 7'),
    path('M10.4 11v5.2M13.6 11v5.2'),
  ],
  plus: [path('M12 5.2v13.6M5.2 12h13.6')],
  minus: [path('M5.2 12h13.6')],
  close: [path('M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8')],
  check: [path('M4.8 12.6 9.6 17.4 19.2 6.8')],
  'chevron-right': [path('M9.6 5.4 16.2 12l-6.6 6.6')],
  'chevron-down': [path('M5.4 9.6 12 16.2l6.6-6.6')],
  'chevron-left': [path('M14.4 5.4 7.8 12l6.6 6.6')],
  'arrow-up': [path('M12 20V4.4'), path('M6 10.4 12 4.4l6 6')],
  'arrow-down': [path('M12 4v15.6'), path('M6 13.6 12 19.6l6-6')],
  'arrow-left': [path('M20 12H4.4'), path('M10.4 6 4.4 12l6 6')],
  'arrow-right': [path('M4 12h15.6'), path('M13.6 6l6 6-6 6')],
  'drag-handle': [
    circle(9.2, 7, 1.25, { fill: 'currentColor', stroke: 'none' }),
    circle(14.8, 7, 1.25, { fill: 'currentColor', stroke: 'none' }),
    circle(9.2, 12, 1.25, { fill: 'currentColor', stroke: 'none' }),
    circle(14.8, 12, 1.25, { fill: 'currentColor', stroke: 'none' }),
    circle(9.2, 17, 1.25, { fill: 'currentColor', stroke: 'none' }),
    circle(14.8, 17, 1.25, { fill: 'currentColor', stroke: 'none' }),
  ],
  'more-vertical': [
    circle(12, 5, 1.25, { fill: 'currentColor', stroke: 'none' }),
    circle(12, 12, 1.25, { fill: 'currentColor', stroke: 'none' }),
    circle(12, 19, 1.25, { fill: 'currentColor', stroke: 'none' }),
  ],
  merge: [
    path('M4.5 6.5v3a4 4 0 0 0 4 4h11'),
    path('M4.5 17.5v-3a4 4 0 0 1 4-4'),
    path('M15.5 9.5 19.5 13.5 15.5 17.5'),
  ],

  // 状态与记录
  clock: [circle(12, 12, 8.2), path('M12 7.6V12l3 1.8')],
  folder: [
    path('M3.6 7.4A1.6 1.6 0 0 1 5.2 5.8h3.6l2 2.4h8A1.6 1.6 0 0 1 20.4 9.8v7.8a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6Z'),
  ],
  import: [path('M12 15.6V4.4'), path('M7.4 9 12 4.4 16.6 9'), path('M4.8 19.6h14.4')],
  export: [path('M12 4.4v11.2'), path('M7.4 11 12 15.6 16.6 11'), path('M4.8 19.6h14.4')],
  user: [circle(12, 8.2, 3.6), path('M5.4 20c0-3.6 2.9-6.4 6.6-6.4s6.6 2.8 6.6 6.4')],
  settings: [
    circle(12, 12, 3),
    path(
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z',
    ),
  ],
  feather: [
    path('M20 4c-5.5.2-9.6 2.3-12.3 6.2C5.9 12.8 5 15.7 5 20'),
    path('M7.8 16.2c2.7-.2 5.1-1 7.2-2.6M4 20h6'),
  ],
  sun: [circle(12, 12, 4), path('M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4')],
  moon: [path('M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.6 8.6 0 1 0 20.4 15.2Z')],
}

const shapes = computed(() => ICONS[props.name] || [])
</script>
