<template>
  <section
    class="map-explorer"
    :class="{
      'map-explorer--detail': detailOpen && selectedLocationState,
      'map-explorer--gallery-collapsed': galleryCollapsed,
    }"
  >
    <div
      ref="mapViewport"
      class="map-explorer__viewport"
      data-testid="map-viewport"
      @pointerdown="startPan"
      @pointermove="movePan"
      @pointerup="endPan"
      @pointercancel="endPan"
      @wheel="handleWheel"
    >
      <div class="map-explorer__stage" :style="stageStyle">
        <div class="map-explorer__art" :class="{ 'map-explorer__art--fallback': mapImageFailed }">
          <img
            v-if="!mapImageFailed"
            :src="MAP_BACKGROUND"
            alt="密涅瓦世界地图：溪谷、湖泊、森林与群山的水彩地图"
            draggable="false"
            @error="mapImageFailed = true"
          />
        </div>

        <svg
          class="map-explorer__routes"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            v-for="route in routes"
            :key="route.id"
            :x1="route.from.x"
            :y1="route.from.y"
            :x2="route.to.x"
            :y2="route.to.y"
            :class="'map-route--' + route.state"
          />
        </svg>

        <button
          v-for="location in locationsWithState"
          :key="location.id"
          type="button"
          class="map-location-marker"
          :class="[
            'map-location-marker--' + location.status,
            { 'map-location-marker--selected': selectedLocationState?.id === location.id },
          ]"
          :style="{
            '--location-x': location.x + '%',
            '--location-y': location.y + '%',
            '--location-accent': location.accent,
          }"
          :aria-label="
            (location.status === 'undiscovered' ? '未知地点' : location.name) +
            '，' +
            statusMeta[location.status].label
          "
          :aria-pressed="selectedLocationState?.id === location.id"
          :data-testid="'map-location-' + location.id"
          @pointerdown.stop
          @click.stop="selectLocation(location)"
        >
          <span class="map-location-marker__symbol" aria-hidden="true">
            {{ statusMeta[location.status].symbol }}
          </span>
          <span class="map-location-marker__label">
            <strong>{{ location.status === 'undiscovered' ? '未知地点' : location.name }}</strong>
            <small>{{ statusMeta[location.status].label }}</small>
          </span>
        </button>
      </div>

      <header class="map-hud paper-panel">
        <div class="map-hud__identity">
          <div class="paper-label">密涅瓦图志 · 世界地图</div>
          <div class="map-hud__progress">
            <strong>{{ unlockedCount }} / {{ MAP_LOCATIONS.length }}</strong>
            <span>地点已抵达</span>
          </div>
        </div>

        <div class="map-hud__actions">
          <div class="map-resource-anchor">
            <button
              type="button"
              class="map-tool-button map-tool-button--resource"
              :aria-expanded="resourceOpen"
              :aria-label="`可移栽树木，共 ${totalAvailableTrees} 棵`"
              @click.stop="resourceOpen = !resourceOpen"
            >
              <span aria-hidden="true">♧</span>
              <strong>{{ totalAvailableTrees }}</strong>
              <small>可移栽树木</small>
            </button>

            <section v-if="resourceOpen" class="map-resource-popover paper-panel">
              <div class="map-resource-popover__header">
                <div>
                  <div class="paper-label">苗木清单</div>
                  <h3>可用与累计</h3>
                </div>
                <button type="button" aria-label="关闭树木清单" @click="resourceOpen = false">
                  ×
                </button>
              </div>
              <div class="map-resource-list subtle-scrollbar">
                <div v-for="tree in treeResources" :key="tree.id" class="map-resource-row">
                  <img :src="tree.icon" alt="" />
                  <span>{{ tree.name }}</span>
                  <strong>{{ tree.available }}</strong>
                  <small>累计 {{ tree.cumulative }}</small>
                </div>
              </div>
              <p>地点投入只扣除可用树木，不会减少行动森林中的长期成果。</p>
            </section>
          </div>

          <div class="map-zoom-controls" aria-label="地图缩放控制">
            <button type="button" aria-label="缩小地图" @click="zoomBy(-0.15)">−</button>
            <output aria-live="polite">{{ Math.round(viewport.scale * 100) }}%</output>
            <button type="button" aria-label="放大地图" @click="zoomBy(0.15)">＋</button>
          </div>
          <button
            type="button"
            class="map-tool-button"
            aria-label="复位地图视角"
            @click="resetViewport"
          >
            <span aria-hidden="true">⌖</span><small>复位视角</small>
          </button>
        </div>
      </header>

      <div class="map-status-legend" aria-label="地点状态图例">
        <span v-for="status in legendStatuses" :key="status.key">
          <i :class="'map-status-legend__symbol map-status-legend__symbol--' + status.key">
            {{ status.symbol }}
          </i>
          {{ status.label }}
        </span>
      </div>

      <aside
        v-if="detailOpen && selectedLocationState"
        class="map-detail paper-panel subtle-scrollbar"
        data-testid="map-location-detail"
      >
        <div class="map-detail__topline">
          <span class="paper-label">{{ selectedLocationState.region }}</span>
          <button type="button" aria-label="关闭地点详情" @click="detailOpen = false">×</button>
        </div>

        <button
          type="button"
          class="map-scene-preview"
          :class="{
            'map-scene-preview--locked': selectedLocationState.status !== 'unlocked',
            'map-scene-preview--placeholder': !selectedLocationState.sceneImage,
          }"
          :style="{ '--scene-accent': selectedLocationState.accent }"
          :disabled="selectedLocationState.status !== 'unlocked'"
          @click="openScene(selectedLocationState)"
        >
          <img
            v-if="
              selectedLocationState.sceneImage && !failedSceneImages.has(selectedLocationState.id)
            "
            :src="selectedLocationState.sceneImage"
            :alt="selectedLocationState.sceneAlt"
            @error="markSceneImageFailed(selectedLocationState.id)"
          />
          <span v-else class="map-scene-placeholder" aria-hidden="true">
            <b>{{ locationIndex(selectedLocationState) }}</b>
            <em>{{ selectedLocationState.status === 'unlocked' ? '场景图志' : '未完成墨线' }}</em>
          </span>
          <span v-if="selectedLocationState.status !== 'unlocked'" class="map-scene-preview__veil">
            {{ selectedLocationState.status === 'undiscovered' ? '尚未发现' : '尚未抵达' }}
          </span>
          <span v-else class="map-scene-preview__open">查看完整场景 ↗</span>
        </button>

        <div class="map-detail__heading">
          <span :class="'map-status-badge map-status-badge--' + selectedLocationState.status">
            {{ statusMeta[selectedLocationState.status].symbol }}
            {{ statusMeta[selectedLocationState.status].label }}
          </span>
          <h2>
            {{
              selectedLocationState.status === 'undiscovered'
                ? '地图上的模糊轮廓'
                : selectedLocationState.name
            }}
          </h2>
        </div>

        <p class="map-detail__description">
          {{
            selectedLocationState.status === 'undiscovered'
              ? '这片区域仍藏在薄雾里。先抵达与它相邻的地点，新的路径才会显现。'
              : selectedLocationState.status === 'unlocked'
                ? selectedLocationState.description
                : selectedLocationState.summary
          }}
        </p>

        <section v-if="selectedLocationState.status !== 'undiscovered'" class="map-requirements">
          <div class="map-section-heading">
            <span class="paper-label">
              {{ selectedLocationState.status === 'unlocked' ? '投入记录' : '移栽需求' }}
            </span>
            <h3>
              {{ selectedLocationState.status === 'unlocked' ? '抵达时的树木' : '让地点恢复生机' }}
            </h3>
          </div>

          <div v-if="displayedRequirements.length" class="map-requirement-list">
            <div
              v-for="requirement in displayedRequirements"
              :key="requirement.treeId"
              class="map-requirement-row"
              :class="{ 'map-requirement-row--met': requirement.met }"
            >
              <img :src="treeById(requirement.treeId)?.icon" alt="" />
              <span>{{ treeById(requirement.treeId)?.name || requirement.treeId }}</span>
              <strong>
                {{
                  selectedLocationState.status === 'unlocked'
                    ? requirement.required
                    : requirement.available + ' / ' + requirement.required
                }}
              </strong>
              <small v-if="selectedLocationState.status !== 'unlocked'">
                {{ requirement.met ? '已备齐' : '还差 ' + requirement.missing }}
              </small>
            </div>
          </div>
          <div v-else class="map-requirements__empty">起始地点不需要投入树木。</div>
        </section>

        <button
          v-if="selectedLocationState.status !== 'unlocked'"
          type="button"
          class="map-unlock-button"
          :disabled="selectedLocationState.status !== 'ready' || unlockingLocationId !== null"
          @click="confirmUnlock(selectedLocationState)"
        >
          <span aria-hidden="true">{{ selectedLocationState.status === 'ready' ? '◇' : '○' }}</span>
          {{ unlockButtonLabel }}
        </button>

        <section v-else class="map-skill-link">
          <div class="map-section-heading">
            <span class="paper-label">场景归属</span>
            <h3>关联一项长期技能</h3>
          </div>
          <label>
            <span class="sr-only">关联 Skill</span>
            <select :value="selectedSkillId" @change="updateSkillAssociation">
              <option value="">暂不关联</option>
              <option v-for="skill in actionStore.skills" :key="skill.id" :value="skill.id">
                {{ skill.name }}
              </option>
            </select>
          </label>

          <div v-if="associatedSkillSummary" class="map-skill-summary">
            <strong>{{ associatedSkillSummary.name }}</strong>
            <span>{{ associatedSkillSummary.actionCount }} 个行动</span>
            <span>{{ associatedSkillSummary.totalTrees }} 棵树</span>
            <span>{{ formatDuration(associatedSkillSummary.totalTimeSpent) }}</span>
            <button type="button" @click="openAssociatedForest">查看关联森林 →</button>
          </div>
          <p
            v-else-if="selectedLocationState.unlockRecord?.skillNameSnapshot"
            class="map-skill-orphan"
          >
            曾关联“{{ selectedLocationState.unlockRecord.skillNameSnapshot }}”；原 Skill
            已删除，可重新选择。
          </p>

          <dl class="map-unlock-history">
            <div>
              <dt>抵达时间</dt>
              <dd>{{ formatDate(selectedLocationState.unlockRecord?.unlockedAt) }}</dd>
            </div>
          </dl>
        </section>
      </aside>

      <section class="map-gallery paper-panel" aria-label="已解锁场景画廊">
        <button
          type="button"
          class="map-gallery__toggle"
          :aria-expanded="!galleryCollapsed"
          @click="galleryCollapsed = !galleryCollapsed"
        >
          <span>
            <b>场景画廊</b>
            <small>{{ galleryLocations.length }} 幅已收藏场景</small>
          </span>
          <span aria-hidden="true">{{ galleryCollapsed ? '⌃' : '⌄' }}</span>
        </button>

        <div v-if="!galleryCollapsed" class="map-gallery__strip subtle-scrollbar">
          <button
            v-for="location in galleryLocations"
            :key="location.id"
            type="button"
            class="map-gallery-card"
            :class="{ 'map-gallery-card--selected': selectedLocationState?.id === location.id }"
            :style="{ '--scene-accent': location.accent }"
            @click="selectLocation(location)"
          >
            <img
              v-if="location.sceneImage && !failedSceneImages.has(location.id)"
              :src="location.sceneImage"
              alt=""
              @error="markSceneImageFailed(location.id)"
            />
            <span v-else class="map-gallery-card__placeholder" aria-hidden="true">图志</span>
            <span class="map-gallery-card__caption">
              <strong>{{ location.name }}</strong>
              <small>{{ gallerySkillName(location) }}</small>
            </span>
          </button>
        </div>
      </section>

      <div v-if="newDiscoveryNotice" class="map-discovery-toast" role="status">
        <span aria-hidden="true">✦</span>
        <div>
          <strong>新的路径显现了</strong>
          <p>{{ newDiscoveryNotice }}</p>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="map-scene-fade">
        <div
          v-if="fullscreenLocation"
          class="map-scene-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="fullscreenLocation.name + '完整场景'"
          @click.self="fullscreenLocation = null"
        >
          <button type="button" class="map-scene-modal__close" @click="fullscreenLocation = null">
            关闭场景 ×
          </button>
          <figure :style="{ '--scene-accent': fullscreenLocation.accent }">
            <img
              v-if="fullscreenLocation.sceneImage && !failedSceneImages.has(fullscreenLocation.id)"
              :src="fullscreenLocation.sceneImage"
              :alt="fullscreenLocation.sceneAlt"
              @error="markSceneImageFailed(fullscreenLocation.id)"
            />
            <div v-else class="map-scene-modal__placeholder">
              <span>{{ locationIndex(fullscreenLocation) }}</span>
              <strong>{{ fullscreenLocation.name }}</strong>
              <small>正式场景仍在图志中生长</small>
            </div>
            <figcaption>
              <span>{{ fullscreenLocation.region }}</span>
              <strong>{{ fullscreenLocation.name }}</strong>
              <p>{{ fullscreenLocation.description }}</p>
            </figcaption>
          </figure>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
import { alertDialog, confirmDialog } from '@/composables/dialogService'
import { MAP_BACKGROUND, MAP_LOCATION_BY_ID, MAP_LOCATIONS } from '@/config/mapCatalog'
import { TREE_TYPES } from '@/config/treeCatalog'
import { MAP_SCALE_MAX, MAP_SCALE_MIN } from '@/local-backend/domain/mapModel'
import { useActionStore } from '@/stores/actionStore'
import { useMapStore } from '@/stores/mapStore'

const mapStore = useMapStore()
const actionStore = useActionStore()
const actionWorkflow = useActionWorkflow()
const {
  mapState,
  locationsWithState,
  selectedLocationState,
  unlockedCount,
  totalAvailableTrees,
  treeResources,
  galleryLocations,
} = storeToRefs(mapStore)

const mapViewport = ref(null)
const detailOpen = ref(true)
const resourceOpen = ref(false)
const galleryCollapsed = ref(false)
const fullscreenLocation = ref(null)
const unlockingLocationId = ref(null)
const newDiscoveryNotice = ref('')
const mapImageFailed = ref(false)
const failedSceneImages = ref(new Set())
const viewport = reactive({ ...mapState.value.viewport })

const statusMeta = {
  undiscovered: { label: '未发现', symbol: '?' },
  discovered: { label: '已发现', symbol: '○' },
  ready: { label: '可解锁', symbol: '◆' },
  unlocked: { label: '已解锁', symbol: '⌂' },
}
const legendStatuses = Object.entries(statusMeta).map(([key, value]) => ({ key, ...value }))

const stageStyle = computed(() => ({
  transform:
    'translate3d(' + viewport.x + 'px, ' + viewport.y + 'px, 0) scale(' + viewport.scale + ')',
}))

const routes = computed(() => {
  const seen = new Set()
  const states = Object.fromEntries(
    locationsWithState.value.map((location) => [location.id, location]),
  )
  const result = []
  for (const location of locationsWithState.value) {
    for (const adjacentId of location.adjacent || []) {
      const adjacent = states[adjacentId]
      if (!adjacent) continue
      const id = [location.id, adjacentId].sort().join(':')
      if (seen.has(id)) continue
      seen.add(id)
      const state =
        location.status === 'unlocked' && adjacent.status === 'unlocked'
          ? 'unlocked'
          : location.status === 'undiscovered' || adjacent.status === 'undiscovered'
            ? 'hidden'
            : 'discovered'
      result.push({ id, from: location, to: adjacent, state })
    }
  }
  return result
})

const displayedRequirements = computed(() => {
  const location = selectedLocationState.value
  if (!location) return []
  if (location.status !== 'unlocked') return location.requirementsProgress
  return Object.entries(location.unlockRecord?.recipeSnapshot || {}).map(([treeId, required]) => ({
    treeId,
    required,
    available: required,
    missing: 0,
    met: true,
  }))
})

const unlockButtonLabel = computed(() => {
  if (unlockingLocationId.value) return '正在写入图志…'
  if (selectedLocationState.value?.status === 'ready') return '解锁地点'
  if (selectedLocationState.value?.status === 'undiscovered') return '路径尚未显现'
  return '树木不足'
})
const selectedSkillId = computed(() => selectedLocationState.value?.unlockRecord?.skillId || '')
const associatedSkillSummary = computed(() =>
  actionStore.skillSummaries.find((skill) => skill.id === selectedSkillId.value),
)

let panState = null
let viewportSaveTimer = null
let discoveryTimer = null

const MAP_OVERLAY_SELECTOR =
  '.map-location-marker, .map-hud, .map-detail, .map-gallery, .map-status-legend'
const isMapOverlayEvent = (event) => Boolean(event.target?.closest?.(MAP_OVERLAY_SELECTOR))

const treeById = (treeId) => TREE_TYPES.find((tree) => tree.id === treeId)
const markSceneImageFailed = (locationId) => {
  failedSceneImages.value = new Set([...failedSceneImages.value, locationId])
}
const locationIndex = (location) => {
  const index = mapStore.MAP_LOCATIONS.findIndex((item) => item.id === location.id)
  return index >= 0 ? String(index + 1).padStart(2, '0') : 'H'
}
const scheduleViewportSave = () => {
  window.clearTimeout(viewportSaveTimer)
  viewportSaveTimer = window.setTimeout(() => mapStore.setViewport(viewport), 140)
}
const clampViewport = () => {
  const rect = mapViewport.value?.getBoundingClientRect()
  if (!rect) return
  const maxX = rect.width * 0.52 * viewport.scale
  const maxY = rect.height * 0.48 * viewport.scale
  viewport.x = Math.min(maxX, Math.max(-maxX, viewport.x))
  viewport.y = Math.min(maxY, Math.max(-maxY, viewport.y))
}
const startPan = (event) => {
  if (event.button !== 0 || isMapOverlayEvent(event)) return
  mapViewport.value?.setPointerCapture?.(event.pointerId)
  panState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    viewportX: viewport.x,
    viewportY: viewport.y,
    moved: false,
  }
}
const movePan = (event) => {
  if (!panState || panState.pointerId !== event.pointerId) return
  const dx = event.clientX - panState.startX
  const dy = event.clientY - panState.startY
  if (Math.abs(dx) + Math.abs(dy) > 5) panState.moved = true
  viewport.x = panState.viewportX + dx
  viewport.y = panState.viewportY + dy
  clampViewport()
}
const endPan = (event) => {
  if (!panState || panState.pointerId !== event.pointerId) return
  mapViewport.value?.releasePointerCapture?.(event.pointerId)
  const moved = panState.moved
  panState = null
  scheduleViewportSave()
  if (!moved && !isMapOverlayEvent(event)) {
    detailOpen.value = false
    resourceOpen.value = false
  }
}
const zoomBy = (delta) => {
  viewport.scale = Math.min(MAP_SCALE_MAX, Math.max(MAP_SCALE_MIN, viewport.scale + delta))
  clampViewport()
  scheduleViewportSave()
}
const handleWheel = (event) => {
  if (isMapOverlayEvent(event)) return
  event.preventDefault()
  zoomBy(event.deltaY > 0 ? -0.1 : 0.1)
}
const resetViewport = () => {
  Object.assign(viewport, { x: 0, y: 0, scale: 1 })
  mapStore.resetViewport()
}
const focusLocation = (location) => {
  const rect = mapViewport.value?.getBoundingClientRect()
  if (!rect || location.historical) return
  const focusX = detailOpen.value ? 0.39 : 0.5
  viewport.x = (focusX - location.x / 100) * rect.width * viewport.scale
  viewport.y = (0.46 - location.y / 100) * rect.height * viewport.scale
  clampViewport()
  scheduleViewportSave()
}
const selectLocation = (location) => {
  mapStore.selectLocation(location.id)
  detailOpen.value = true
  resourceOpen.value = false
  focusLocation(location)
}

const confirmUnlock = async (location) => {
  if (location.status !== 'ready' || unlockingLocationId.value) return
  const lines = location.requirementsProgress
    .map((item) => (treeById(item.treeId)?.name || item.treeId) + ' × ' + item.required)
    .join('\n')
  const confirmed = await confirmDialog(
    '确认向“' + location.name + '”投入以下树木吗？\n' + lines + '\n\n累计树木与行动森林不会减少。',
    { title: '确认解锁地点', confirmText: '投入并解锁' },
  )
  if (!confirmed) return

  unlockingLocationId.value = location.id
  const result = mapStore.unlockLocation(location.id)
  unlockingLocationId.value = null
  if (!result.ok) {
    const message =
      result.error === 'save_failed'
        ? '本地存档写入失败，树木与地点状态已回滚。请先导出备份并检查设备存储。'
        : '地点状态或树木余额已经变化，请重新检查后再试。'
    await alertDialog(message, { title: '未能解锁地点' })
    return
  }

  const names = (result.newlyDiscoveredLocationIds || [])
    .filter((locationId) => locationId !== location.id)
    .map((locationId) => MAP_LOCATION_BY_ID[locationId]?.name)
    .filter(Boolean)
  if (names.length > 0) {
    newDiscoveryNotice.value = names.join('、')
    window.clearTimeout(discoveryTimer)
    discoveryTimer = window.setTimeout(() => (newDiscoveryNotice.value = ''), 4200)
  }
}

const updateSkillAssociation = async (event) => {
  const location = selectedLocationState.value
  if (!location) return
  const result = mapStore.associateLocationSkill(location.id, event.target.value || null)
  if (!result.ok) {
    await alertDialog('关联结果未能写入本地存档，已恢复原状态。', { title: '关联失败' })
  }
}
const openAssociatedForest = () => {
  if (associatedSkillSummary.value) actionWorkflow.openSkillForest(associatedSkillSummary.value.id)
}
const openScene = (location) => {
  if (location.status === 'unlocked') fullscreenLocation.value = location
}
const gallerySkillName = (location) => {
  const skillId = location.unlockRecord?.skillId
  return (
    actionStore.skills.find((skill) => skill.id === skillId)?.name ||
    location.unlockRecord?.skillNameSnapshot ||
    '未关联 Skill'
  )
}
const formatDate = (value) => {
  if (!value) return '起始地点'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '记录时间未知' : date.toLocaleString()
}
const formatDuration = (seconds = 0) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? hours + ' 小时 ' + minutes + ' 分' : minutes + ' 分钟'
}
const handleKeydown = (event) => {
  if (event.key !== 'Escape') return
  if (fullscreenLocation.value) fullscreenLocation.value = null
  else if (resourceOpen.value) resourceOpen.value = false
  else detailOpen.value = false
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.clearTimeout(viewportSaveTimer)
  window.clearTimeout(discoveryTimer)
  mapStore.setViewport(viewport)
})
</script>

<style scoped>
.map-explorer {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 12px 14px 14px;
  overflow: hidden;
}

.map-explorer__viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--bark) 48%, transparent);
  border-radius: 16px;
  background: #c9d8cc;
  box-shadow:
    inset 0 0 80px rgba(43, 53, 39, 0.2),
    var(--shadow-paper);
  cursor: grab;
  isolation: isolate;
  touch-action: none;
}

.map-explorer__viewport:active {
  cursor: grabbing;
}

.map-explorer__viewport::after {
  position: absolute;
  inset: 0;
  z-index: 2;
  content: '';
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(252, 247, 230, 0.04), rgba(57, 68, 53, 0.13)),
    radial-gradient(circle at center, transparent 55%, rgba(54, 49, 36, 0.18));
  box-shadow: inset 0 0 0 7px rgba(246, 235, 211, 0.2);
}

.map-explorer__stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  transform-origin: center;
  transition: transform 180ms ease-out;
  will-change: transform;
}

.map-explorer__viewport:active .map-explorer__stage {
  transition: none;
}

.map-explorer__art {
  position: absolute;
  inset: -2px;
  overflow: hidden;
  background:
    radial-gradient(circle at 70% 40%, rgba(115, 150, 161, 0.62), transparent 22%),
    linear-gradient(135deg, #d7dfc5, #8fa98a 52%, #d8bf8c);
}

.map-explorer__art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}

.app-shell[data-theme='night'] .map-explorer__art img {
  filter: brightness(0.58) saturate(0.72) sepia(0.08);
}

.map-explorer__art--fallback::before {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.5;
  background-image:
    linear-gradient(rgba(56, 76, 62, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 76, 62, 0.15) 1px, transparent 1px);
  background-size: 52px 52px;
}

.map-explorer__routes {
  position: absolute;
  inset: 0;
  z-index: 4;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.map-explorer__routes line {
  vector-effect: non-scaling-stroke;
  stroke: rgba(65, 70, 53, 0.54);
  stroke-width: 2;
  stroke-dasharray: 7 8;
  stroke-linecap: round;
  filter: drop-shadow(0 1px 0 rgba(252, 243, 218, 0.75));
}

.map-explorer__routes .map-route--unlocked {
  stroke: color-mix(in srgb, var(--forest-deep) 78%, #c9a856);
  stroke-width: 3;
  stroke-dasharray: none;
}

.map-explorer__routes .map-route--hidden {
  opacity: 0.16;
}

.map-location-marker {
  position: absolute;
  top: var(--location-y);
  left: var(--location-x);
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 0;
  padding: 0;
  color: #2e332a;
  background: transparent;
  cursor: pointer;
  transform: translate(-20px, -20px);
}

.map-location-marker__symbol {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 2px solid rgba(255, 248, 230, 0.9);
  border-radius: 50%;
  color: #fffaf0;
  background: #586451;
  box-shadow: 0 4px 14px rgba(43, 48, 36, 0.35);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.map-location-marker:hover,
.map-location-marker:focus-visible {
  z-index: 16;
}

.map-location-marker:hover .map-location-marker__symbol,
.map-location-marker:focus-visible .map-location-marker__symbol {
  transform: translateY(-2px) scale(1.05);
}

.map-location-marker--undiscovered .map-location-marker__symbol {
  border-style: dashed;
  color: rgba(255, 250, 240, 0.74);
  background: rgba(48, 55, 48, 0.64);
  backdrop-filter: blur(4px);
}

.map-location-marker--discovered .map-location-marker__symbol {
  border-color: #5c6755;
  color: #47573e;
  background: rgba(250, 241, 217, 0.94);
}

.map-location-marker--ready .map-location-marker__symbol {
  border-radius: 12px;
  color: #fff8db;
  background: #a37d32;
  transform: rotate(45deg);
  animation: map-ready-pulse 2.2s ease-in-out infinite;
}

.map-location-marker--unlocked .map-location-marker__symbol {
  border-radius: 14px 14px 50% 50%;
  background: var(--location-accent);
}

.map-location-marker--selected .map-location-marker__symbol {
  box-shadow:
    0 0 0 4px rgba(255, 250, 235, 0.92),
    0 0 0 7px #2f3d2d,
    0 8px 20px rgba(34, 42, 31, 0.35);
}

.map-location-marker__label {
  display: flex;
  min-width: 106px;
  max-width: 166px;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid rgba(74, 65, 47, 0.35);
  border-radius: 3px 9px 9px 3px;
  padding: 6px 9px;
  color: #3b372e;
  background: rgba(250, 243, 224, 0.9);
  box-shadow: 0 4px 12px rgba(53, 47, 37, 0.16);
  text-align: left;
  backdrop-filter: blur(5px);
}

.map-location-marker__label strong {
  width: 100%;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-location-marker__label small {
  margin-top: 1px;
  color: #746c5c;
  font-size: 9px;
}

.map-location-marker--undiscovered .map-location-marker__label {
  min-width: 76px;
  opacity: 0.72;
}

.map-hud {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 30;
  display: flex;
  width: min(530px, calc(100% - 420px));
  min-width: 390px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 10px 12px 10px 15px;
  cursor: default;
}

.map-hud__identity,
.map-hud__actions,
.map-zoom-controls {
  display: flex;
  align-items: center;
}

.map-hud__identity {
  min-width: 0;
  gap: 14px;
}

.map-hud__progress {
  display: flex;
  flex-direction: column;
  padding-left: 13px;
  border-left: 1px solid var(--line);
}

.map-hud__progress strong {
  color: var(--forest-deep);
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1;
}

.map-hud__progress span {
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 9px;
  white-space: nowrap;
}

.map-hud__actions {
  gap: 7px;
}

.map-tool-button,
.map-zoom-controls {
  min-height: 38px;
  border: 1px solid var(--line);
  border-radius: 9px;
  color: var(--ink);
  background: color-mix(in srgb, var(--paper-strong) 84%, transparent);
}

.map-tool-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 9px;
}

.map-tool-button small,
.map-tool-button strong {
  font-size: 10px;
}

.map-tool-button--resource strong {
  color: var(--forest);
  font-size: 14px;
}

.map-zoom-controls button {
  width: 30px;
  height: 36px;
  color: var(--forest);
  font-size: 16px;
}

.map-zoom-controls output {
  min-width: 43px;
  color: var(--ink-soft);
  font-size: 9px;
  text-align: center;
}

.map-resource-anchor {
  position: static;
}

.map-resource-popover {
  position: absolute;
  top: calc(100% + 9px);
  left: 0;
  z-index: 45;
  width: 286px;
  max-width: 100%;
  padding: 14px;
}

.map-resource-popover__header,
.map-detail__topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.map-resource-popover h3,
.map-section-heading h3 {
  margin-top: 3px;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 750;
}

.map-resource-popover__header button,
.map-detail__topline button {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--ink-soft);
}

.map-resource-list {
  max-height: 220px;
  margin-top: 11px;
  overflow-y: auto;
}

.map-resource-row {
  display: grid;
  grid-template-columns: 28px 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px 3px;
  border-top: 1px solid var(--line);
  font-size: 11px;
}

.map-resource-row img,
.map-requirement-row img {
  width: 25px;
  height: 25px;
  object-fit: contain;
}

.map-resource-row strong {
  color: var(--forest);
  font-size: 13px;
}

.map-resource-row small {
  color: var(--ink-soft);
  font-size: 9px;
}

.map-resource-popover > p {
  margin-top: 10px;
  color: var(--ink-soft);
  font-size: 10px;
  line-height: 1.65;
}

.map-status-legend {
  position: absolute;
  top: 82px;
  left: 17px;
  z-index: 20;
  display: flex;
  gap: 5px;
  border: 1px solid rgba(75, 69, 51, 0.28);
  border-radius: 8px;
  padding: 5px 7px;
  color: #4b493f;
  background: rgba(246, 237, 214, 0.82);
  box-shadow: 0 4px 14px rgba(54, 49, 38, 0.1);
  font-size: 9px;
  cursor: default;
  backdrop-filter: blur(6px);
}

.map-status-legend span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}

.map-status-legend__symbol {
  display: inline-grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border: 1px solid #636858;
  border-radius: 50%;
  font-family: var(--font-display);
  font-style: normal;
  font-weight: 800;
}

.map-status-legend__symbol--ready {
  border-radius: 5px;
  color: #fff7df;
  background: #9f7a32;
}

.map-status-legend__symbol--unlocked {
  color: #fff7df;
  background: #52674d;
}

.map-status-legend__symbol--undiscovered {
  border-style: dashed;
  opacity: 0.62;
}

.map-detail {
  position: absolute;
  top: 16px;
  right: 16px;
  bottom: 151px;
  z-index: 32;
  width: clamp(300px, 29%, 372px);
  padding: 13px;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
  cursor: default;
}

.map-detail__topline {
  margin-bottom: 9px;
}

.map-scene-preview {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--scene-accent) 55%, var(--line));
  border-radius: 10px 10px 5px 5px;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--scene-accent) 32%, #f2e6ce), #d9cfb8),
    var(--paper-muted);
}

.map-scene-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 240ms ease;
}

.map-scene-preview:not(:disabled):hover img {
  transform: scale(1.025);
}

.map-scene-preview--locked img {
  filter: grayscale(0.72) blur(3px) brightness(0.55);
  transform: scale(1.04);
}

.map-scene-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: color-mix(in srgb, var(--scene-accent) 75%, #3d3a30);
  background:
    radial-gradient(circle at 35% 38%, rgba(255, 255, 255, 0.28), transparent 28%),
    repeating-linear-gradient(135deg, transparent 0 18px, rgba(76, 72, 55, 0.06) 18px 19px);
}

.map-scene-placeholder b {
  font-family: var(--font-display);
  font-size: 30px;
}

.map-scene-placeholder em {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 11px;
  font-style: normal;
  letter-spacing: 0.12em;
}

.map-scene-preview__veil {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #f4eddf;
  background: rgba(35, 41, 35, 0.3);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.map-scene-preview__open {
  position: absolute;
  right: 8px;
  bottom: 8px;
  border-radius: 6px;
  padding: 5px 7px;
  color: #fff9e9;
  background: rgba(37, 47, 35, 0.76);
  font-size: 9px;
}

.map-detail__heading {
  margin-top: 13px;
}

.map-detail__heading h2 {
  margin-top: 7px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(20px, 2vw, 27px);
  font-weight: 760;
  line-height: 1.15;
}

.map-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 7px;
  color: var(--ink-soft);
  background: color-mix(in srgb, var(--paper-muted) 58%, transparent);
  font-size: 9px;
  font-weight: 800;
}

.map-status-badge--ready {
  border-color: color-mix(in srgb, var(--ochre) 64%, transparent);
  color: color-mix(in srgb, var(--ochre) 75%, var(--ink));
}

.map-status-badge--unlocked {
  border-color: color-mix(in srgb, var(--forest) 56%, transparent);
  color: var(--forest);
}

.map-detail__description {
  margin-top: 9px;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.72;
}

.map-requirements,
.map-skill-link {
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid var(--line);
}

.map-requirement-list {
  margin-top: 8px;
}

.map-requirement-row {
  display: grid;
  grid-template-columns: 27px 1fr auto auto;
  align-items: center;
  gap: 7px;
  padding: 7px 0;
  border-top: 1px dashed var(--line);
  font-size: 10px;
}

.map-requirement-row strong {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.map-requirement-row small {
  min-width: 43px;
  color: var(--coral);
  text-align: right;
}

.map-requirement-row--met small {
  color: var(--forest);
}

.map-requirements__empty {
  margin-top: 8px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  padding: 9px;
  color: var(--ink-soft);
  font-size: 10px;
  text-align: center;
}

.map-unlock-button {
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  border: 1px solid var(--forest-deep);
  border-radius: 9px;
  color: #fff9e9;
  background: var(--forest-deep);
  font-size: 12px;
  font-weight: 800;
}

.map-unlock-button:disabled {
  border-color: var(--line);
  color: var(--ink-soft);
  background: var(--paper-muted);
}

.map-skill-link select {
  width: 100%;
  margin-top: 9px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--ink);
  background: var(--paper);
  font-size: 11px;
}

.map-skill-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 9px;
  margin-top: 9px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 9px;
  background: color-mix(in srgb, var(--sage) 10%, transparent);
  font-size: 9px;
}

.map-skill-summary strong,
.map-skill-summary button {
  grid-column: 1 / -1;
}

.map-skill-summary button {
  margin-top: 3px;
  border-top: 1px solid var(--line);
  padding-top: 7px;
  color: var(--forest);
  font-weight: 800;
  text-align: left;
}

.map-skill-orphan {
  margin-top: 9px;
  color: var(--ink-soft);
  font-size: 10px;
  line-height: 1.6;
}

.map-unlock-history {
  margin-top: 9px;
  color: var(--ink-soft);
  font-size: 9px;
}

.map-unlock-history div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.map-unlock-history dd {
  color: var(--ink);
}

.map-gallery {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  z-index: 28;
  display: flex;
  height: 120px;
  padding: 8px;
  cursor: default;
  transition:
    right 180ms ease,
    height 180ms ease;
}

.map-explorer--detail .map-gallery {
  right: calc(clamp(300px, 29%, 372px) + 27px);
}

.map-gallery__toggle {
  display: flex;
  width: 78px;
  flex: 0 0 78px;
  align-items: center;
  justify-content: space-between;
  border-right: 1px solid var(--line);
  padding: 5px 9px 5px 3px;
  color: var(--ink);
  text-align: left;
}

.map-gallery__toggle span:first-child {
  display: flex;
  flex-direction: column;
}

.map-gallery__toggle b {
  font-family: var(--font-display);
  font-size: 12px;
}

.map-gallery__toggle small {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 8px;
  line-height: 1.4;
}

.map-gallery__strip {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 8px;
  padding-left: 8px;
  overflow-x: auto;
}

.map-gallery-card {
  position: relative;
  width: 145px;
  height: 100%;
  flex: 0 0 145px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 7px;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--scene-accent) 40%, #f3ead5), #d7cbb5),
    var(--paper-muted);
}

.map-gallery-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.map-gallery-card--selected {
  border-color: var(--forest-deep);
  box-shadow:
    inset 0 0 0 2px var(--paper-strong),
    inset 0 0 0 4px var(--forest-deep);
}

.map-gallery-card__placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: color-mix(in srgb, var(--scene-accent) 70%, var(--ink));
  font-family: var(--font-display);
}

.map-gallery-card__caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 7px 6px;
  color: #fff9eb;
  background: linear-gradient(transparent, rgba(34, 41, 32, 0.88));
  text-align: left;
}

.map-gallery-card__caption strong,
.map-gallery-card__caption small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-gallery-card__caption strong {
  font-family: var(--font-display);
  font-size: 10px;
}

.map-gallery-card__caption small {
  margin-top: 2px;
  opacity: 0.78;
  font-size: 8px;
}

.map-explorer--gallery-collapsed .map-gallery {
  width: 178px;
  height: 45px;
  right: auto;
}

.map-explorer--gallery-collapsed .map-gallery__toggle {
  width: 100%;
  flex-basis: 100%;
  border-right: 0;
}

.map-discovery-toast {
  position: absolute;
  top: 91px;
  left: 50%;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 260px;
  border: 1px solid rgba(201, 168, 86, 0.72);
  border-radius: 10px;
  padding: 10px 13px;
  color: var(--ink);
  background: color-mix(in srgb, var(--paper-strong) 94%, #f1d992);
  box-shadow: var(--shadow-float);
  transform: translateX(-50%);
}

.map-discovery-toast > span {
  color: var(--ochre);
  font-size: 20px;
}

.map-discovery-toast strong {
  font-family: var(--font-display);
  font-size: 12px;
}

.map-discovery-toast p {
  margin-top: 2px;
  color: var(--ink-soft);
  font-size: 9px;
}

.map-scene-modal {
  position: fixed;
  inset: 0;
  z-index: 240;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(18, 24, 19, 0.9);
  backdrop-filter: blur(12px);
}

.map-scene-modal__close {
  position: absolute;
  top: 24px;
  right: 28px;
  z-index: 2;
  border: 1px solid rgba(255, 250, 236, 0.34);
  border-radius: 999px;
  padding: 8px 12px;
  color: #fff9e9;
  background: rgba(28, 36, 29, 0.72);
  font-size: 11px;
}

.map-scene-modal figure {
  position: relative;
  width: min(1120px, 92vw);
  max-height: 86vh;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid rgba(255, 248, 228, 0.42);
  border-radius: 8px;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--scene-accent) 44%, #efe2c8), #c7baa2), #d8cfbd;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.48);
}

.map-scene-modal figure > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.map-scene-modal figcaption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 58px 28px 22px;
  color: #fff9e9;
  background: linear-gradient(transparent, rgba(27, 34, 28, 0.91));
}

.map-scene-modal figcaption span {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.map-scene-modal figcaption strong {
  display: block;
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 28px;
}

.map-scene-modal figcaption p {
  max-width: 720px;
  margin-top: 5px;
  color: rgba(255, 249, 233, 0.78);
  font-size: 11px;
  line-height: 1.65;
}

.map-scene-modal__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: color-mix(in srgb, var(--scene-accent) 72%, #3c382f);
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.32), transparent 25%),
    repeating-linear-gradient(135deg, transparent 0 30px, rgba(70, 68, 52, 0.07) 30px 31px);
}

.map-scene-modal__placeholder span {
  font-family: var(--font-display);
  font-size: 42px;
}

.map-scene-modal__placeholder strong {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 24px;
}

.map-scene-modal__placeholder small {
  margin-top: 5px;
  font-size: 10px;
  letter-spacing: 0.14em;
}

.map-scene-fade-enter-active,
.map-scene-fade-leave-active {
  transition: opacity 180ms ease;
}

.map-scene-fade-enter-from,
.map-scene-fade-leave-to {
  opacity: 0;
}

@keyframes map-ready-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 0 rgba(201, 168, 86, 0),
      0 4px 14px rgba(43, 48, 36, 0.35);
  }
  50% {
    box-shadow:
      0 0 0 7px rgba(201, 168, 86, 0.28),
      0 4px 14px rgba(43, 48, 36, 0.35);
  }
}

@container (max-width: 900px) {
  .map-hud {
    width: min(472px, calc(100% - 322px));
    min-width: 356px;
  }

  .map-hud .paper-label,
  .map-tool-button small {
    display: none;
  }

  .map-detail {
    width: 292px;
  }

  .map-explorer--detail .map-gallery {
    right: 319px;
  }

  .map-location-marker__label {
    min-width: 92px;
    max-width: 126px;
  }
}

@media (max-height: 760px) {
  .map-detail {
    bottom: 131px;
  }

  .map-gallery {
    height: 100px;
  }

  .map-resource-row {
    padding-block: 5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-location-marker--ready .map-location-marker__symbol {
    animation: none;
  }
}
</style>
