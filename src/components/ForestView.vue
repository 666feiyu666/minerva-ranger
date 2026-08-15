<template>
  <div
    class="forest-page flex-1 flex flex-col h-full overflow-hidden relative selection:bg-transparent"
    :class="store.isNightMode ? 'bg-[#221c15]' : 'bg-[#eadcc8]'"
  >
    <div v-if="!viewingAction" class="flex flex-col h-full">
      <div class="forest-page__hero shrink-0">
        <div
          class="forest-paper border overflow-hidden transition-all duration-500"
          :class="
            store.isNightMode
              ? 'bg-[#17120e] border-[#453628]'
              : 'bg-[#f7efe3] border-[#d9c4a8] ring-1 ring-black/5'
          "
        >
          <div
            class="px-7 pt-6 pb-4 border-b"
            :class="
              store.isNightMode ? 'border-[#3a2f24] bg-[#140f0b]' : 'border-[#e2d2bc] bg-[#f3e8d8]'
            "
          >
            <div class="flex justify-between items-start gap-6">
              <div>
                <div
                  class="text-xs uppercase tracking-[0.28em] font-bold"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  技能总览
                </div>
                <h2
                  class="text-3xl font-bold flex items-center gap-3 mt-2 transition-colors"
                  :class="store.isNightMode ? 'text-emerald-300' : 'text-emerald-700'"
                >
                  <span class="forest-section-mark" aria-hidden="true">林</span>
                  {{
                    currentSkillName === '全局' ? '全局森林巡视' : currentSkillName + ' · 森林巡视'
                  }}
                </h2>
                <p
                  class="text-sm mt-2 transition-colors"
                  :class="store.isNightMode ? 'text-gray-400' : 'text-gray-600'"
                >
                  从这里查看技能下的行动与汇总成长，巡视你的知识森林。
                </p>
              </div>

              <div class="shrink-0 text-right">
                <div
                  class="text-xs uppercase tracking-[0.24em]"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  汇总
                </div>
                <div
                  class="mt-2 text-2xl font-black"
                  :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
                >
                  {{ displayActions.length }} <span class="text-base font-bold">个行动</span>
                </div>
                <div
                  class="text-sm mt-1"
                  :class="store.isNightMode ? 'text-emerald-300' : 'text-emerald-700'"
                >
                  {{ displayTreeCount }} 棵树木
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="forest-page__list flex-1 overflow-y-auto custom-scrollbar">
        <div
          class="forest-paper border overflow-hidden"
          :class="
            store.isNightMode
              ? 'bg-[#17120e] border-[#453628]'
              : 'bg-[#f7efe3] border-[#d9c4a8] ring-1 ring-black/5'
          "
        >
          <div
            class="px-7 py-5 border-b flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
            :class="
              store.isNightMode ? 'border-[#3a2f24] bg-[#140f0b]' : 'border-[#e2d2bc] bg-[#f3e8d8]'
            "
          >
            <div class="max-w-3xl">
              <div
                class="text-xs uppercase tracking-[0.24em] font-bold"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                行动编排
              </div>
              <div
                class="text-lg font-bold mt-1"
                :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
              >
                {{
                  currentSkillName === '全局'
                    ? '以列表方式巡视所有行动'
                    : '以列表方式巡视 ' + currentSkillName + ' 的行动'
                }}
              </div>
              <p
                class="text-sm mt-3 leading-7"
                :class="store.isNightMode ? 'text-stone-300/80' : 'text-[#6a5643]'"
              >
                技能数据由下属行动汇总；你也可以进入单个行动查看等级、树木、累计时长和树种分布。
              </p>
            </div>

            <div class="flex flex-wrap gap-2 lg:justify-end">
              <span
                class="px-3 py-1.5 rounded-full text-xs font-bold border"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/25 text-gray-200'
                    : 'border-white/60 bg-white/75 text-[#5d4633]'
                "
              >
                列表优先
              </span>
              <span
                class="px-3 py-1.5 rounded-full text-xs font-bold border"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/25 text-gray-200'
                    : 'border-white/60 bg-white/75 text-[#5d4633]'
                "
              >
                按行动巡视
              </span>
            </div>
          </div>

          <div
            v-if="displayActions.length === 0"
            class="px-7 py-14 text-center"
            :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
          >
            <div class="forest-empty-mark" aria-hidden="true">空</div>
            <p class="font-semibold">这个技能下还没有行动。</p>
            <p class="text-sm mt-2">可以先在左侧新建行动，或把现有行动拖进这个技能。</p>
          </div>

          <div
            v-else
            class="divide-y"
            :class="store.isNightMode ? 'divide-gray-800' : 'divide-black/5'"
          >
            <button
              v-for="action in displayActions"
              :key="action.id"
              class="w-full px-7 py-6 flex items-center gap-5 text-left transition-all group"
              :class="store.isNightMode ? 'hover:bg-[#211911]' : 'hover:bg-[#fff8ef]'"
              @click="openInspection(action)"
            >
              <div
                class="w-14 h-14 shrink-0 rounded-2xl border flex items-center justify-center text-3xl"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-[#241b14]'
                    : 'border-[#e3d1ba] bg-[#fffaf3]'
                "
              >
                {{ action.icon || '📁' }}
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-3 flex-wrap">
                  <h3
                    class="font-bold text-lg truncate"
                    :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
                  >
                    {{ action.name }}
                  </h3>
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-bold border"
                    :class="
                      store.isNightMode
                        ? 'border-blue-900 bg-blue-900/20 text-blue-300'
                        : 'border-blue-200 bg-blue-50 text-blue-700'
                    "
                  >
                    Lv. {{ action.level }}
                  </span>
                </div>

                <div
                  class="flex flex-wrap items-center gap-3 mt-2 text-xs"
                  :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'"
                >
                  <span>{{ action.totalTrees }} 棵树</span>
                  <span>⏱ {{ formatDuration(action.totalTimeSpent) }}</span>
                  <span>{{ getActionTreeStats(action).length }} 种树木</span>
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <template v-if="getActionTreeStats(action).length > 0">
                    <span
                      v-for="tree in getActionTreeStats(action).slice(0, 4)"
                      :key="tree.id"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
                      :class="
                        store.isNightMode
                          ? 'border-white/10 bg-[#241b14] text-gray-300'
                          : 'border-[#e3d1ba] bg-[#fffdf8] text-gray-600'
                      "
                    >
                      <img :src="tree.icon" class="w-4 h-4 object-contain pixel-art" />
                      x{{ tree.count }}
                    </span>
                  </template>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold opacity-70"
                    :class="
                      store.isNightMode
                        ? 'border-white/10 bg-[#241b14] text-gray-400'
                        : 'border-[#e3d1ba] bg-[#fffdf8] text-gray-500'
                    "
                  >
                    还没有树木陈列
                  </span>
                </div>
              </div>

              <div class="shrink-0 flex flex-col items-end gap-2">
                <div
                  class="w-11 h-11 rounded-full border flex items-center justify-center text-xl transition-all group-hover:translate-x-1"
                  :class="
                    store.isNightMode
                      ? 'border-emerald-800 bg-emerald-900/20 text-emerald-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  "
                >
                  →
                </div>
                <div
                  class="text-[10px] uppercase tracking-[0.2em]"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  查看
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="absolute inset-0 z-50 flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden bg-black"
    >
      <div
        class="absolute top-0 left-0 w-full p-6 pr-28 md:pr-32 flex justify-between items-start z-[100] pointer-events-none"
      >
        <button
          @click="closeInspection"
          class="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur transition-all border shadow-lg group"
          :class="
            store.isNightMode
              ? 'text-gray-200 bg-black/50 border-gray-700 hover:bg-black/70'
              : 'text-gray-700 bg-white/50 border-white/50 hover:bg-white/80'
          "
        >
          <span>←</span>
          <span class="text-sm font-bold group-hover:pl-1 transition-all">返回行动列表</span>
        </button>

        <div
          class="pointer-events-auto border p-4 rounded-xl shadow-2xl backdrop-blur-md transition-colors min-w-[220px] max-w-[280px] mr-6 md:mr-10"
          :class="
            store.isNightMode
              ? 'bg-gray-900/80 border-gray-700 text-white'
              : 'bg-white/80 border-white/60 text-gray-800'
          "
        >
          <div class="flex justify-between items-start mb-1">
            <h2 class="text-xl font-bold">{{ viewingAction.name }}</h2>
            <span
              class="text-sm font-bold flex items-center gap-1"
              :class="store.isNightMode ? 'text-green-400' : 'text-emerald-600'"
            >
              🌲 {{ viewingAction.totalTrees }}
            </span>
          </div>

          <button
            v-if="store.activeActionId !== viewingAction.id"
            @click="setActiveAndStay"
            class="mt-2 w-full py-1.5 text-white text-[10px] font-bold uppercase rounded shadow bg-emerald-500 hover:bg-emerald-400"
          >
            选择此行动
          </button>
        </div>
      </div>

      <div class="flex-1 relative w-full h-full overflow-hidden">
        <div
          class="absolute inset-0 z-0 pixel-art pointer-events-none"
          :style="{
            backgroundImage: `url(${store.isNightMode ? bgForestNight : bgForestDay})`,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom left',
            backgroundSize: 'auto 100%',
          }"
        ></div>

        <div
          v-if="scenicForestTrees.length === 0"
          class="absolute inset-x-0 bottom-[120px] z-30 flex flex-col items-center justify-center opacity-70"
        >
          <div class="text-4xl animate-bounce mb-2">🌱</div>
          <span class="bg-black/40 text-white px-3 py-1 rounded text-xs whitespace-nowrap"
            >这里还没有树木，先完成一次行动吧。</span
          >
        </div>

        <div class="absolute inset-x-0 bottom-[18px] h-[320px] z-30 pointer-events-none">
          <div
            v-for="tree in scenicForestTrees"
            :key="tree.layoutId"
            class="absolute flex flex-col items-center origin-bottom transition-transform duration-300 hover:scale-105"
            :style="{
              left: `${tree.x}%`,
              bottom: `${tree.bottom}px`,
              transform: `translateX(-50%) scale(${tree.scale})`,
              zIndex: tree.z,
            }"
          >
            <img
              :src="tree.icon"
              class="relative w-auto h-[180px] object-contain pixel-art drop-shadow-2xl"
              :class="store.isNightMode ? 'brightness-75' : ''"
              :title="tree.name"
            />
          </div>
        </div>

        <div class="absolute inset-x-0 bottom-0 h-[92px] z-40 pointer-events-none overflow-hidden">
          <div
            v-for="tile in scenicGroundTiles"
            :key="tile.id"
            class="absolute bottom-0 pixel-art"
            :style="{
              left: `${tile.x}%`,
              width: `${tile.width}px`,
              height: '76px',
              transform: 'translateX(-50%)',
              backgroundImage: `url(${normalLandImg})`,
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'bottom center',
              backgroundSize: 'auto 100%',
              filter: store.isNightMode ? 'brightness(0.6)' : 'none',
              zIndex: tile.z,
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
import { useAppStore } from '@/stores/appStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useActionStore } from '@/stores/actionStore'

const appStore = useAppStore()
const playerStore = usePlayerStore()
const actionStore = useActionStore()
const actionWorkflow = useActionWorkflow()
const store = reactive({
  ...storeToRefs(appStore),
  ...storeToRefs(actionStore),
  TREE_TYPES: playerStore.TREE_TYPES,
  selectAction: actionWorkflow.selectAction,
})

// 素材导入
import normalLandImg from '@/assets/land/normal_land.png'
import bgForestDay from '@/assets/background/normal_background_day.png'
import bgForestNight from '@/assets/background/normal_background_night.png'

const viewingAction = ref(null)
const inspectionSeed = ref(Date.now())

// === 【新增】：基于 activeSkillId 的计算属性 ===

// 1. 根据当前是否选中了某个技能，动态过滤要展示的行动
const displayActions = computed(() => {
  if (store.activeSkillId) {
    return store.actions.filter((p) => p.skillId === store.activeSkillId)
  }
  return store.actions // 如果没有 activeSkillId（比如从侧边栏直接点击），则显示全局
})

// 2. 动态计算当前视图下的树木总数
const displayTreeCount = computed(() => {
  return displayActions.value.reduce((sum, p) => sum + p.totalTrees, 0)
})

// 3. 动态获取当前技能的名字（用于顶部标题显示）
const currentSkillName = computed(() => {
  if (store.activeSkillId) {
    const skill = store.skills.find((t) => t.id === store.activeSkillId)
    return skill ? skill.name : '全局'
  }
  return '全局'
})

// [新增] 获取行动内具体的树木统计
const getActionTreeStats = (action) => {
  if (!action.forest) return []
  // 遍历 forest 对象 { t1: 5, t2: 3 }
  return Object.entries(action.forest)
    .map(([id, count]) => {
      const treeType = store.TREE_TYPES.find((t) => t.id === id)
      return treeType ? { ...treeType, count } : null
    })
    .filter((item) => item && item.count > 0) // 过滤掉无效或数量为0的
    .sort((a, b) => b.xp - a.xp) // 按高级程度排序，高级树排前面
}

// 将森林数据展平为数组
const flatForest = computed(() => {
  if (!viewingAction.value || !viewingAction.value.forest) return []
  const list = []
  Object.entries(viewingAction.value.forest).forEach(([treeId, count]) => {
    const treeData = store.TREE_TYPES.find((t) => t.id === treeId)
    if (!treeData) return
    for (let i = 0; i < count; i++) {
      list.push({
        ...treeData,
        instanceId: `${treeId}-${i}`,
      })
    }
  })
  return list
})

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const hashString = (value = '') => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createSeededRandom = (seed) => {
  let state = seed || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const scenicForestTrees = computed(() => {
  if (!viewingAction.value || flatForest.value.length === 0) return []

  const forestSignature = Object.entries(viewingAction.value.forest || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([treeId, count]) => `${treeId}:${count}`)
    .join('|')
  const seed = hashString(`${viewingAction.value.id}-${forestSignature}`)
  const rng = createSeededRandom(seed ^ inspectionSeed.value)
  const minTarget = Math.min(20, flatForest.value.length)
  const maxTarget = Math.min(40, flatForest.value.length)
  const targetCount =
    maxTarget <= minTarget
      ? flatForest.value.length
      : Math.floor(minTarget + rng() * (maxTarget - minTarget + 1))

  const sampled = [...flatForest.value]
    .map((tree) => ({ tree, weight: rng() }))
    .sort((left, right) => left.weight - right.weight)
    .slice(0, targetCount)
    .map((entry) => entry.tree)

  return sampled
    .map((tree, index) => {
      const laneRatio = targetCount === 1 ? 0.5 : index / (targetCount - 1)
      const baseX = 8 + laneRatio * 84
      const x = clamp(baseX + (rng() - 0.5) * 4.8, 6, 94)
      const depth = rng()
      const scale = 0.78 + depth * 0.34
      const bottom = -6 + (1 - depth) * 40

      return {
        ...tree,
        layoutId: `${tree.instanceId}-${index}`,
        x,
        scale,
        bottom,
        z: 20 + Math.round(depth * 30),
      }
    })
    .sort((left, right) => left.z - right.z)
})

const scenicGroundTiles = computed(() => {
  if (!viewingAction.value || scenicForestTrees.value.length === 0) return []

  const forestSignature = Object.entries(viewingAction.value.forest || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([treeId, count]) => `${treeId}:${count}`)
    .join('|')
  const seed = hashString(`ground-${viewingAction.value.id}-${forestSignature}`)
  const rng = createSeededRandom(seed)
  const tiles = []

  let x = 0
  let index = 0
  while (x < 112) {
    const width = 160 + rng() * 70
    tiles.push({
      id: `ground-${index}`,
      x,
      width,
      z: 100 + index,
    })
    x += 8.5 + rng() * 3.5
    index += 1
  }

  return tiles
})

const openInspection = (action) => {
  viewingAction.value = action
  inspectionSeed.value = Date.now()
}

const closeInspection = () => {
  viewingAction.value = null
}
const setActiveAndStay = () => {
  if (viewingAction.value) store.selectAction(viewingAction.value.id)
}

const formatDuration = (seconds) => {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
</script>

<style scoped>
.forest-page {
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 100% 0%, var(--sage-wash), transparent 28%), var(--paper-base) !important;
}

.forest-page__hero {
  padding: 22px clamp(24px, 3vw, 42px) 10px;
}

.forest-page__list {
  min-height: 0;
  overscroll-behavior: contain;
  padding: 4px clamp(24px, 3vw, 42px) 48px;
}

.forest-paper {
  border-radius: 12px;
  border-color: var(--line-soft) !important;
  color: var(--ink-strong) !important;
  background: var(--paper-raised) !important;
  box-shadow: 0 10px 30px rgba(48, 47, 41, 0.08);
}

.forest-paper > div:first-child {
  border-color: var(--line-soft) !important;
  background: var(--paper-muted) !important;
}

.forest-paper button {
  border-color: var(--line-soft);
}

.forest-paper h2,
.forest-paper h3 {
  color: var(--ink-strong) !important;
}

.forest-paper p,
.forest-paper [class*='text-gray'] {
  color: var(--ink-muted) !important;
}

.forest-section-mark,
.forest-empty-mark {
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--forest-700);
  font-family: var(--font-display);
}

.forest-section-mark {
  width: 34px;
  height: 34px;
  font-size: 15px;
}

.forest-empty-mark {
  width: 44px;
  height: 44px;
  margin: 0 auto 12px;
  font-size: 16px;
}

@container (max-width: 700px) {
  .forest-page__hero {
    padding: 14px 12px 8px;
  }

  .forest-page__list {
    padding: 2px 12px 32px;
  }
}

.pixel-art {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* === 修改这里：让滚动条可见且美观 === */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px; /* 纵向滚动条宽度 */
  height: 6px; /* 横向滚动条高度 (用于森林内部滚动) */
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3); /* 半透明灰色 */
  border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5); /* 鼠标悬停变深 */
}

/* Firefox 适配 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}
</style>
