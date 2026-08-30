<template>
  <aside class="app-sidebar flex h-full flex-shrink-0 select-none flex-col">
    <div class="app-sidebar__brand">
      <div class="app-sidebar__seal" aria-hidden="true">M</div>
      <h1 class="display-title text-lg">密涅瓦的巡林官</h1>
    </div>

    <div class="app-sidebar__progress">
      <div class="flex justify-between items-end text-xs mb-1">
        <span class="font-bold">巡林等级 {{ store.globalLevel }}</span>
        <span>{{ Math.floor(store.globalXP) }} 经验</span>
      </div>
      <div class="app-sidebar__progress-track" title="巡林等级进度">
        <div
          class="h-full transition-all duration-500"
          :style="{ width: store.globalLevelProgress + '%' }"
        ></div>
      </div>
    </div>

    <div class="app-sidebar__system">
      <div>
        <button
          @click="systemAppsExpanded = !systemAppsExpanded"
          class="app-sidebar__section-toggle"
        >
          <span>图志目录</span>
          <span aria-hidden="true">{{ systemAppsExpanded ? '−' : '+' }}</span>
        </button>

        <div v-show="systemAppsExpanded" class="mt-1 space-y-1">
          <button
            @click="store.openShop()"
            :class="
              navBtnClass(
                'shop',
                'text-yellow-500',
                'bg-yellow-700',
                'text-yellow-700',
                'bg-yellow-100',
              )
            "
          >
            <span class="app-sidebar__nav-mark">苗</span><span>巡林苗圃</span>
          </button>
          <button
            @click="store.openMap()"
            :class="
              navBtnClass('map', 'text-amber-500', 'bg-amber-900', 'text-amber-700', 'bg-amber-100')
            "
          >
            <span class="app-sidebar__nav-mark">图</span><span>密涅瓦地图</span>
          </button>
          <button
            @click="store.openNotebook()"
            :class="
              navBtnClass(
                'notebook',
                'text-blue-500',
                'bg-blue-800',
                'text-blue-700',
                'bg-blue-100',
              )
            "
          >
            <span class="app-sidebar__nav-mark">记</span><span>巡林笔记</span>
          </button>
        </div>
      </div>
    </div>

    <div class="app-sidebar__section-label">
      <span>技能与行动</span>
    </div>

    <div class="subtle-scrollbar flex-1 overflow-y-auto overflow-x-visible px-2 pb-2">
      <div
        v-if="groupedActions.length === 0"
        class="p-4 text-center text-sm mt-4"
        :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
      >
        <p>暂无技能与行动</p>
      </div>

      <div v-for="group in groupedActions" :key="group.id || 'unclassified'" class="mb-2">
        <div
          class="app-sidebar__skill-row group"
          :class="[
            store.isNightMode
              ? 'text-gray-400 hover:text-white hover:bg-white/5'
              : 'text-gray-500 hover:text-gray-800 hover:bg-black/5',
            dragOverSkillId === group.id
              ? store.isNightMode
                ? 'bg-blue-900/30 border border-blue-500/50'
                : 'bg-blue-50 border border-blue-300'
              : 'border border-transparent',
          ]"
          @click="toggleSkill(group.id)"
          @dragover.prevent="dragOverSkillId = group.id"
          @dragleave.prevent="dragOverSkillId = null"
          @drop="handleDropOnSkill(group.id, $event)"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="inline-block flex-none transition-transform"
              :class="expandedSkills.has(group.id) ? 'rotate-90' : ''"
              >›</span
            >

            <div v-if="editingSkillId === group.id" class="min-w-0" @click.stop>
              <input
                ref="renameSkillInput"
                v-model="editSkillName"
                @blur="confirmRenameSkill"
                @keyup.enter="confirmRenameSkill"
                @keyup.esc="cancelRenameSkill"
                type="text"
                class="w-full min-w-0 rounded border border-blue-500 bg-transparent px-1 py-0.5 text-xs outline-none"
                :class="store.isNightMode ? 'text-white' : 'text-gray-900'"
              />
            </div>
            <span v-else class="truncate" :title="group.name">{{ group.name }}</span>
          </div>

          <div class="app-sidebar__skill-actions">
            <button
              v-if="group.id && editingSkillId !== group.id"
              @click.stop="store.moveSkill(group.id, -1)"
              :disabled="!canMoveSkill(group.id, -1)"
              class="app-sidebar__skill-action-button hover:bg-black/10 dark:hover:bg-white/10"
              :aria-label="`将“${group.name}”向上移动`"
              :title="`将“${group.name}”向上移动`"
            >
              <span aria-hidden="true">↑</span>
            </button>
            <button
              v-if="group.id && editingSkillId !== group.id"
              @click.stop="store.moveSkill(group.id, 1)"
              :disabled="!canMoveSkill(group.id, 1)"
              class="app-sidebar__skill-action-button hover:bg-black/10 dark:hover:bg-white/10"
              :aria-label="`将“${group.name}”向下移动`"
              :title="`将“${group.name}”向下移动`"
            >
              <span aria-hidden="true">↓</span>
            </button>
            <button
              v-if="group.id && editingSkillId !== group.id"
              @click.stop="startRenameSkill(group)"
              class="app-sidebar__skill-action-button hover:bg-black/10 dark:hover:bg-white/10"
              title="重命名技能"
            >
              改
            </button>
            <button
              v-if="group.id"
              @click.stop="handleDeleteSkill(group)"
              class="app-sidebar__skill-action-button text-red-500 hover:bg-red-500/20"
              title="删除技能"
            >
              删
            </button>
            <span v-if="!group.id" class="text-[10px]">未归属技能</span>
          </div>
        </div>

        <div v-show="expandedSkills.has(group.id)" class="mt-1 space-y-1">
          <div
            v-if="group.actions.length === 0"
            class="text-center text-[10px] py-2 opacity-50"
            :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
          >
            暂无行动
          </div>

          <div
            v-for="action in group.actions"
            :key="action.id"
            draggable="true"
            @dragstart="handleDragStart(action, $event)"
            @dragend="resetDragState"
            @dragover.prevent="handleActionDragOver(action, $event)"
            @drop="handleActionDrop(action, $event)"
            @click="store.selectAction(action.id)"
            class="pb-1 relative transition-all z-10"
            :class="{
              'z-50': activeMenuId === action.id,
              'pt-3': dragOverActionId === action.id && dragInsertPosition === 'before',
              'pb-4': dragOverActionId === action.id && dragInsertPosition === 'after',
            }"
          >
            <div
              v-if="dragOverActionId === action.id && dragInsertPosition === 'before'"
              class="absolute left-3 right-3 top-0 h-0.5 rounded-full"
              :class="
                store.isNightMode
                  ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                  : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
              "
            ></div>

            <div
              class="app-sidebar__action-row group/item"
              :class="[
                isActive(action.id)
                  ? store.isNightMode
                    ? 'bg-[#353535] border-green-500'
                    : 'bg-emerald-50 border-emerald-500 shadow-sm'
                  : store.isNightMode
                    ? 'border-transparent hover:bg-[#2a2a2a]'
                    : 'border-transparent hover:bg-white/60',
                dragOverActionId === action.id
                  ? store.isNightMode
                    ? 'ring-1 ring-amber-500/40'
                    : 'ring-1 ring-amber-300'
                  : '',
              ]"
            >
              <div
                class="absolute left-1 opacity-0 group-hover/item:opacity-100 cursor-move text-xs mr-1"
                :class="store.isNightMode ? 'text-gray-600' : 'text-gray-400'"
              >
                ⋮⋮
              </div>

              <div class="app-sidebar__action-mark pointer-events-none">
                {{ actionMark(action) }}
              </div>

              <div class="text-left flex-1 min-w-0">
                <div v-if="editingId === action.id" class="mr-2" @click.stop>
                  <input
                    ref="renameInput"
                    v-model="editName"
                    @blur="confirmRename"
                    @keyup.enter="confirmRename"
                    @keyup.esc="cancelRename"
                    type="text"
                    class="w-full text-sm px-1 py-0.5 rounded outline-none border border-blue-500 bg-transparent"
                    :class="store.isNightMode ? 'text-white' : 'text-gray-900'"
                  />
                </div>

                <div v-else class="pointer-events-none">
                  <div
                    class="font-bold text-sm truncate"
                    :class="
                      isActive(action.id)
                        ? store.isNightMode
                          ? 'text-white'
                          : 'text-emerald-900'
                        : store.isNightMode
                          ? 'text-gray-400'
                          : 'text-gray-600'
                    "
                  >
                    {{ action.name }}
                  </div>
                  <div
                    class="text-[10px] flex justify-between mt-1"
                    :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                  >
                    <span>Lv. {{ action.level }}</span>
                    <span>{{ action.totalTrees }} 棵树</span>
                  </div>
                  <div
                    class="w-full h-1 mt-1 rounded-full overflow-hidden"
                    :class="store.isNightMode ? 'bg-gray-700' : 'bg-gray-200'"
                  >
                    <div
                      class="bg-blue-500 h-full transition-all"
                      :style="{ width: (action.currentXP / action.nextLevelXP) * 100 + '%' }"
                    ></div>
                  </div>
                </div>
              </div>

              <button
                @click.stop="toggleMenu(action.id)"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-all z-10"
                :class="[
                  activeMenuId === action.id ? 'opacity-100 bg-black/10 dark:bg-white/10' : '',
                  store.isNightMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-400 hover:text-gray-800 hover:bg-black/5',
                ]"
                title="更多操作"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              <div
                v-if="activeMenuId === action.id"
                class="absolute right-0 top-full mt-1 w-32 rounded-lg shadow-xl border z-50 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col py-1"
                :class="
                  store.isNightMode ? 'bg-[#252525] border-gray-700' : 'bg-white border-gray-200'
                "
                @click.stop
              >
                <button
                  @click="startRename(action)"
                  class="text-left px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t"
                  :class="
                    store.isNightMode
                      ? 'border-gray-700 text-blue-400'
                      : 'border-gray-100 text-blue-600'
                  "
                >
                  <span aria-hidden="true">改</span> 重命名
                </button>
                <button
                  @click="openMergeModal(action)"
                  class="text-left px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t"
                  :class="
                    store.isNightMode
                      ? 'border-gray-700 text-amber-400'
                      : 'border-gray-100 text-amber-600'
                  "
                >
                  <span aria-hidden="true">并</span> 合并到…
                </button>
                <button
                  @click="handleDelete(action)"
                  class="text-left px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t"
                  :class="
                    store.isNightMode
                      ? 'text-red-400 border-gray-700'
                      : 'text-red-600 border-gray-100'
                  "
                >
                  <span aria-hidden="true">删</span> 删除
                </button>
              </div>
            </div>

            <div
              v-if="dragOverActionId === action.id && dragInsertPosition === 'after'"
              class="absolute left-3 right-3 bottom-1 h-0.5 rounded-full"
              :class="
                store.isNightMode
                  ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                  : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
              "
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="app-sidebar__footer">
      <div v-if="createMode !== null" class="flex flex-col gap-2">
        <div
          class="text-xs font-bold mb-1 uppercase tracking-widest"
          :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'"
        >
          {{ createMode === 'skill' ? '新建技能' : '新建行动' }}
        </div>
        <input
          v-model="newItemName"
          @keyup.enter="confirmCreate"
          ref="inputRef"
          type="text"
          :placeholder="
            createMode === 'skill' ? '输入技能名称' : '输入动词型行动，例如“审阅前端代码”'
          "
          class="w-full text-sm px-3 py-2 rounded border focus:border-green-500 outline-none transition-colors"
          :class="
            store.isNightMode
              ? 'bg-gray-800 text-white border-gray-600'
              : 'bg-white text-gray-900 border-gray-300 shadow-inner'
          "
        />
        <div class="flex gap-2">
          <button
            @click="confirmCreate"
            class="flex-1 bg-green-700 hover:bg-green-600 text-white text-xs py-1.5 rounded font-bold"
          >
            确认
          </button>
          <button
            @click="createMode = null"
            class="flex-1 text-white text-xs py-1.5 rounded transition-colors"
            :class="
              store.isNightMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-400 hover:bg-gray-500'
            "
          >
            取消
          </button>
        </div>
      </div>

      <div v-else class="flex gap-2">
        <button
          @click="startCreating('action')"
          class="flex-1 flex items-center justify-center gap-1 py-2 rounded transition-colors text-xs font-bold border border-dashed"
          :class="
            store.isNightMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-transparent'
              : 'bg-white/50 hover:bg-white text-gray-500 border-gray-300'
          "
        >
          + 行动
        </button>
        <button
          @click="startCreating('skill')"
          class="flex-1 flex items-center justify-center gap-1 py-2 rounded transition-colors text-xs font-bold border border-dashed"
          :class="
            store.isNightMode
              ? 'bg-[#333] hover:bg-[#444] text-blue-400 border-transparent'
              : 'bg-blue-50/50 hover:bg-blue-50 text-blue-600 border-blue-200'
          "
        >
          + 技能
        </button>
      </div>
    </div>

    <div v-if="mergeSourceAction" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeMergeModal"></div>
      <div
        class="relative w-full max-w-md rounded-2xl border shadow-2xl p-6"
        :class="store.isNightMode ? 'bg-[#171717] border-gray-800' : 'bg-white border-gray-200'"
      >
        <div class="flex justify-between items-start gap-4 mb-4">
          <div>
            <div
              class="text-xs font-bold uppercase tracking-widest mb-1"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              行动整理
            </div>
            <h3
              class="text-xl font-bold"
              :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
            >
              合并行动
            </h3>
          </div>
          <button
            @click="closeMergeModal"
            class="text-xs px-3 py-1 rounded-full border transition-colors"
            :class="
              store.isNightMode
                ? 'border-gray-700 text-gray-400 hover:text-white'
                : 'border-gray-300 text-gray-500 hover:text-gray-800'
            "
          >
            取消
          </button>
        </div>

        <div class="space-y-4">
          <div
            class="rounded-xl border p-4"
            :class="
              store.isNightMode
                ? 'border-amber-900/40 bg-amber-900/10'
                : 'border-amber-200 bg-amber-50'
            "
          >
            <p
              class="text-sm font-semibold mb-2"
              :class="store.isNightMode ? 'text-amber-200' : 'text-amber-800'"
            >
              将保留目标行动，并吸收源行动的数据
            </p>
            <p class="text-sm" :class="store.isNightMode ? 'text-amber-100/80' : 'text-amber-700'">
              源行动：{{ mergeSourceAction.name }}
            </p>
          </div>

          <div class="space-y-2">
            <label
              class="text-xs font-bold uppercase tracking-wider"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              目标行动
            </label>
            <select
              v-model="mergeTargetActionId"
              class="w-full rounded-xl px-4 py-3 border outline-none transition-colors"
              :class="
                store.isNightMode
                  ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-amber-500'
                  : 'bg-white border-gray-300 text-gray-800 focus:border-amber-400'
              "
            >
              <option v-for="action in mergeTargetOptions" :key="action.id" :value="action.id">
                {{ action.name }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label
              class="text-xs font-bold uppercase tracking-wider"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              Commit / 说明（可选）
            </label>
            <textarea
              v-model="mergeCommitMessage"
              placeholder="补充说明为什么要合并，系统日志会保留这条说明。"
              class="w-full rounded-xl px-4 py-3 border outline-none resize-none h-28 transition-colors"
              :class="
                store.isNightMode
                  ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-amber-500 placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-800 focus:border-amber-400 placeholder-gray-400'
              "
            ></textarea>
          </div>

          <div
            class="rounded-xl border p-4 text-sm"
            :class="
              store.isNightMode
                ? 'border-gray-800 bg-[#101010] text-gray-400'
                : 'border-gray-200 bg-gray-50 text-gray-600'
            "
          >
            合并后会迁移源行动的树木、时长、经验和关联会话记录，并生成一条系统记录。
          </div>

          <button
            @click="confirmMergeAction"
            :disabled="!mergeTargetActionId"
            class="w-full py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              store.isNightMode
                ? 'bg-amber-700 text-white hover:bg-amber-600'
                : 'bg-amber-500 text-white hover:bg-amber-400'
            "
          >
            确认合并
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="deleteTargetAction"
      class="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeDeleteModal"></div>
      <div
        class="relative w-full max-w-md rounded-2xl border shadow-2xl p-6"
        :class="store.isNightMode ? 'bg-[#171717] border-gray-800' : 'bg-white border-gray-200'"
      >
        <div class="flex justify-between items-start gap-4 mb-4">
          <div>
            <div
              class="text-xs font-bold uppercase tracking-widest mb-1"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              行动足迹
            </div>
            <h3
              class="text-xl font-bold"
              :class="store.isNightMode ? 'text-white' : 'text-gray-800'"
            >
              删除行动
            </h3>
          </div>
          <button
            @click="closeDeleteModal"
            class="text-xs px-3 py-1 rounded-full border transition-colors"
            :class="
              store.isNightMode
                ? 'border-gray-700 text-gray-400 hover:text-white'
                : 'border-gray-300 text-gray-500 hover:text-gray-800'
            "
          >
            取消
          </button>
        </div>

        <div class="space-y-4">
          <div
            class="rounded-xl border p-4"
            :class="
              store.isNightMode ? 'border-red-900/40 bg-red-900/10' : 'border-red-200 bg-red-50'
            "
          >
            <p
              class="text-sm font-semibold mb-2"
              :class="store.isNightMode ? 'text-red-200' : 'text-red-800'"
            >
              删除后行动本体无法恢复
            </p>
            <p class="text-sm" :class="store.isNightMode ? 'text-red-100/80' : 'text-red-700'">
              目标行动：{{ deleteTargetAction.name }}
            </p>
          </div>

          <div
            class="rounded-xl border p-4 text-sm"
            :class="
              store.isNightMode
                ? 'border-gray-800 bg-[#101010] text-gray-400'
                : 'border-gray-200 bg-gray-50 text-gray-600'
            "
          >
            系统会自动生成一条删除记录，保留行动名称、树木、时长、经验和关联会话数量。
          </div>

          <div class="space-y-2">
            <label
              class="text-xs font-bold uppercase tracking-wider"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              Commit / 说明（可选）
            </label>
            <textarea
              v-model="deleteCommitMessage"
              placeholder="补充说明为什么要删除，系统日志会保留这条说明。"
              class="w-full rounded-xl px-4 py-3 border outline-none resize-none h-28 transition-colors"
              :class="
                store.isNightMode
                  ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-red-500 placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-800 focus:border-red-400 placeholder-gray-400'
              "
            ></textarea>
          </div>

          <button
            @click="confirmDeleteAction"
            class="w-full py-3 rounded-xl font-bold transition-colors"
            :class="
              store.isNightMode
                ? 'bg-red-700 text-white hover:bg-red-600'
                : 'bg-red-500 text-white hover:bg-red-400'
            "
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { alertDialog, confirmDialog } from '@/composables/dialogService'
import { useActionWorkflow } from '@/application/workflows/actionWorkflow'
import { useSkillWorkflow } from '@/application/workflows/skillWorkflow'
import { useAppStore } from '@/stores/appStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useActionStore } from '@/stores/actionStore'

defineOptions({ name: 'SidebarPanel' })

const appStore = useAppStore()
const playerStore = usePlayerStore()
const actionStore = useActionStore()
const actionWorkflow = useActionWorkflow()
const skillWorkflow = useSkillWorkflow()
const store = reactive({
  ...storeToRefs(appStore),
  ...storeToRefs(playerStore),
  ...storeToRefs(actionStore),
  createAction: actionWorkflow.createAction,
  deleteAction: actionWorkflow.deleteAction,
  mergeActions: actionWorkflow.mergeActions,
  selectAction: actionWorkflow.selectAction,
  createSkill: actionStore.createSkill,
  deleteSkill: skillWorkflow.deleteSkill,
  moveActionToSkill: skillWorkflow.moveActionToSkill,
  moveSkill: actionStore.moveSkill,
  renameAction: actionStore.renameAction,
  renameSkill: actionStore.renameSkill,
  reorderActions: actionStore.reorderActions,
  openMap: appStore.openMap,
  openNotebook: appStore.openNotebook,
  openShop: appStore.openShop,
})
const systemAppsExpanded = ref(true)

// === 🌟 分组数据渲染逻辑 ===
const groupedActions = computed(() => {
  const groups = []
  store.skills.forEach((t) => {
    groups.push({
      id: t.id,
      name: t.name,
      actions: store.actions.filter((p) => p.skillId === t.id),
    })
  })
  const unclassified = store.actions.filter((p) => !p.skillId)
  if (unclassified.length > 0 || groups.length === 0) {
    groups.unshift({
      id: null,
      name: '未归属技能',
      actions: unclassified,
    })
  }
  return groups
})

const expandedSkills = ref(new Set([null])) // 默认展开未分类

const toggleSkill = (id) => {
  if (expandedSkills.value.has(id)) expandedSkills.value.delete(id)
  else expandedSkills.value.add(id)
}

const canMoveSkill = (skillId, direction) => {
  const currentIndex = store.skills.findIndex((skill) => skill.id === skillId)
  const targetIndex = currentIndex + direction
  return currentIndex >= 0 && targetIndex >= 0 && targetIndex < store.skills.length
}

// === 🌟 拖拽归类逻辑 ===
const dragOverSkillId = ref(null)
const dragOverActionId = ref(null)
const dragInsertPosition = ref('before')
const draggedActionId = ref(null)

const resetDragState = () => {
  dragOverSkillId.value = null
  dragOverActionId.value = null
  dragInsertPosition.value = 'before'
  draggedActionId.value = null
}

const handleDragStart = (action, event) => {
  draggedActionId.value = action.id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('actionId', action.id)
}

const handleDropOnSkill = (skillId, event) => {
  const actionId = event.dataTransfer.getData('actionId')
  if (actionId) {
    store.moveActionToSkill(actionId, skillId)
  }
  resetDragState()
}

const handleActionDragOver = (action, event) => {
  if (!draggedActionId.value || draggedActionId.value === action.id) return

  dragOverSkillId.value = null
  dragOverActionId.value = action.id

  const bounds = event.currentTarget.getBoundingClientRect()
  const midpoint = bounds.top + bounds.height / 2
  dragInsertPosition.value = event.clientY < midpoint ? 'before' : 'after'
}

const handleActionDrop = (action, event) => {
  const actionId = event.dataTransfer.getData('actionId')
  if (actionId && actionId !== action.id) {
    store.reorderActions(actionId, action.id, dragInsertPosition.value)
  }
  resetDragState()
}

// === 行动/技能创建逻辑 ===
const createMode = ref(null)
const newItemName = ref('')
const inputRef = ref(null)

const startCreating = (mode) => {
  createMode.value = mode
  newItemName.value = ''
  nextTick(() => inputRef.value?.focus())
}

const confirmCreate = () => {
  if (!newItemName.value.trim()) return
  if (createMode.value === 'skill') {
    store.createSkill(newItemName.value)
  } else if (createMode.value === 'action') {
    let targetSkillId = null
    if (expandedSkills.value.size === 1) {
      const onlyId = Array.from(expandedSkills.value)[0]
      targetSkillId = onlyId
    }
    store.createAction(newItemName.value, targetSkillId)
  }
  createMode.value = null
}

// === 行动重命名与删除逻辑 (保留原有) ===
const activeMenuId = ref(null)
const editingId = ref(null)
const editName = ref('')
const renameInput = ref(null)

const closeMenu = () => {
  activeMenuId.value = null
}
onMounted(() => document.addEventListener('click', closeMenu))
onUnmounted(() => document.removeEventListener('click', closeMenu))

const toggleMenu = (id) => {
  activeMenuId.value = activeMenuId.value === id ? null : id
}

const startRename = (action) => {
  editingId.value = action.id
  editName.value = action.name
  activeMenuId.value = null
  nextTick(() => {
    if (renameInput.value && renameInput.value.length > 0) {
      const input = renameInput.value.find((el) => el && el.offsetParent !== null)
      if (input) input.focus()
    }
  })
}

const confirmRename = () => {
  if (editingId.value && editName.value.trim()) store.renameAction(editingId.value, editName.value)
  cancelRename()
}
const cancelRename = () => {
  editingId.value = null
  editName.value = ''
}

const handleDelete = (action) => {
  activeMenuId.value = null
  deleteTargetAction.value = action
}

const mergeSourceAction = ref(null)
const mergeTargetActionId = ref(null)
const mergeCommitMessage = ref('')
const deleteTargetAction = ref(null)
const deleteCommitMessage = ref('')

const mergeTargetOptions = computed(() => {
  if (!mergeSourceAction.value) return []
  return store.actions.filter((action) => action.id !== mergeSourceAction.value.id)
})

const openMergeModal = (action) => {
  activeMenuId.value = null
  if (store.actions.length < 2) {
    void alertDialog('至少需要两个行动才能执行合并', {
      title: '无法合并',
    })
    return
  }
  mergeSourceAction.value = action
  mergeTargetActionId.value = mergeTargetOptions.value[0]?.id || null
  mergeCommitMessage.value = ''
}

const closeMergeModal = () => {
  mergeSourceAction.value = null
  mergeTargetActionId.value = null
  mergeCommitMessage.value = ''
}

const confirmMergeAction = async () => {
  if (!mergeSourceAction.value || !mergeTargetActionId.value) return
  const target = store.actions.find((action) => action.id === mergeTargetActionId.value)
  if (!target) return

  const confirmed = await confirmDialog(
    `确认将行动 "${mergeSourceAction.value.name}" 合并到 "${target.name}" 吗？\n` +
      '合并后源行动会被移除，并生成系统记录。',
    {
      title: '确认行动合并',
      confirmText: '开始合并',
    },
  )

  if (!confirmed) return

  store.mergeActions(mergeSourceAction.value.id, mergeTargetActionId.value, {
    commitMessage: mergeCommitMessage.value,
  })
  closeMergeModal()
}

const closeDeleteModal = () => {
  deleteTargetAction.value = null
  deleteCommitMessage.value = ''
}

const confirmDeleteAction = () => {
  if (!deleteTargetAction.value) return
  store.deleteAction(deleteTargetAction.value.id, {
    commitMessage: deleteCommitMessage.value,
  })
  closeDeleteModal()
}

// === 🌟 技能重命名与删除逻辑 ===
const editingSkillId = ref(null)
const editSkillName = ref('')
const renameSkillInput = ref(null)

const startRenameSkill = (skill) => {
  editingSkillId.value = skill.id
  editSkillName.value = skill.name
  nextTick(() => {
    if (renameSkillInput.value && renameSkillInput.value.length > 0) {
      const input = renameSkillInput.value.find((el) => el && el.offsetParent !== null)
      if (input) input.focus()
    }
  })
}

const confirmRenameSkill = () => {
  if (editingSkillId.value && editSkillName.value.trim())
    store.renameSkill(editingSkillId.value, editSkillName.value)
  cancelRenameSkill()
}
const cancelRenameSkill = () => {
  editingSkillId.value = null
  editSkillName.value = ''
}

const handleDeleteSkill = async (skill) => {
  const confirmed = await confirmDialog(
    `确定要删除技能 "${skill.name}" 吗？\n其下的行动将会被移回“未归属技能”。`,
    {
      title: '删除技能',
      confirmText: '删除',
    },
  )
  if (confirmed) store.deleteSkill(skill.id)
}

// === 样式辅助 ===
const navBtnClass = (view, nightText, nightBg, dayText, dayBg) => {
  const isActive = store.activeView === view
  const isNight = store.isNightMode
  const base = 'app-sidebar__nav-button'
  return isActive
    ? [
        base,
        isNight ? `${nightBg} text-white` : `${dayBg} ${dayText} shadow-md ring-1 ring-black/5`,
      ]
    : [
        base,
        isNight
          ? `bg-[#333] ${nightText} hover:bg-[#3a3a3a]`
          : `bg-white/50 text-gray-500 hover:bg-white/80`,
      ]
}

const actionMark = (action) => (action?.name || '行').trim().slice(0, 1)
const isActive = (id) => store.activeActionId === id && store.activeView === 'dashboard'
</script>

<style scoped>
.app-sidebar {
  position: relative;
  z-index: 50;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  width: clamp(276px, 23vw, 304px);
  border-right: 1px solid var(--line-strong);
  color: var(--ink);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--paper-strong) 96%, transparent), var(--paper)),
    var(--paper);
  box-shadow: 12px 0 36px rgba(44, 48, 37, 0.09);
}

.app-sidebar::after {
  position: absolute;
  top: 0;
  right: 6px;
  bottom: 0;
  width: 1px;
  content: '';
  pointer-events: none;
  background: color-mix(in srgb, var(--line) 70%, transparent);
}

.app-sidebar__brand {
  display: flex;
  height: 68px;
  flex: 0 0 68px;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
}

.app-sidebar__seal {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50% 50% 48% 52%;
  color: var(--paper-strong);
  background: var(--forest-deep);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--sage) 24%, transparent);
}

.app-sidebar__progress {
  flex: 0 0 auto;
  padding: 12px 18px;
  border-bottom: 1px solid var(--line);
  color: var(--ink-soft);
}

.app-sidebar__progress-track {
  height: 5px;
  overflow: hidden;
  border-radius: 99px;
  background: color-mix(in srgb, var(--ink-soft) 14%, transparent);
}

.app-sidebar__progress-track > div {
  border-radius: inherit;
  background: linear-gradient(90deg, var(--sage), var(--forest));
}

.app-sidebar__system {
  flex: 0 0 auto;
  padding: 10px 10px 8px;
  border-bottom: 1px solid var(--line);
}

.app-sidebar__section-toggle,
.app-sidebar__section-label {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.app-sidebar__section-toggle {
  border-radius: 8px;
  padding: 7px 9px;
}

.app-sidebar__section-toggle:hover {
  color: var(--ink);
  background: color-mix(in srgb, var(--sage) 12%, transparent);
}

.app-sidebar__section-label {
  flex: 0 0 auto;
  padding: 14px 18px 8px;
}

:deep(.app-sidebar__nav-button) {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 7px 9px;
  color: var(--ink-soft) !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-align: left;
  text-transform: none;
}

:deep(.app-sidebar__nav-button:hover) {
  color: var(--ink) !important;
  background: color-mix(in srgb, var(--sage) 11%, transparent) !important;
}

:deep(.app-sidebar__nav-button.ring-1) {
  border-color: var(--line-strong) !important;
  color: var(--forest-deep) !important;
  background: color-mix(in srgb, var(--sage) 20%, var(--paper-strong)) !important;
}

.app-sidebar__nav-mark {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 7px;
  color: var(--forest);
  background: var(--paper-strong);
  font-family: var(--font-display);
  font-size: 12px;
}

.app-sidebar__skill-row {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 7px 8px;
  color: var(--ink-soft) !important;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: none;
  cursor: pointer;
}

.app-sidebar__skill-row:hover {
  color: var(--ink) !important;
  background: color-mix(in srgb, var(--sage) 9%, transparent) !important;
}

.app-sidebar__skill-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 150ms ease;
}

.app-sidebar__skill-row:hover .app-sidebar__skill-actions,
.app-sidebar__skill-row:focus-within .app-sidebar__skill-actions {
  opacity: 1;
}

.app-sidebar__skill-action-button {
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  place-items: center;
  border-radius: 6px;
  line-height: 1;
}

.app-sidebar__skill-action-button:focus-visible {
  outline: 2px solid var(--forest);
  outline-offset: 1px;
}

.app-sidebar__skill-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.app-sidebar__skill-action-button:disabled:hover {
  background: transparent !important;
}

.app-sidebar__action-row {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 58px;
  align-items: center;
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  border-radius: 7px;
  padding: 8px 31px 8px 10px;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background 150ms ease;
}

.app-sidebar__action-row:hover {
  background: color-mix(in srgb, var(--paper-strong) 82%, transparent) !important;
}

.app-sidebar__action-row.border-emerald-500 {
  border-color: color-mix(in srgb, var(--forest) 34%, transparent) !important;
  border-left-color: var(--forest) !important;
  background: color-mix(in srgb, var(--sage) 17%, var(--paper-strong)) !important;
  box-shadow: none !important;
}

.app-sidebar__action-mark {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  place-items: center;
  margin: 0 10px 0 3px;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--forest);
  background: var(--paper-strong);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
}

.app-sidebar__footer {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--paper-strong) 74%, transparent);
}

@media (max-width: 1120px) {
  .app-sidebar {
    width: 244px;
  }

  .app-sidebar__brand {
    padding-inline: 14px;
  }
}

@media (max-width: 920px) {
  .app-sidebar {
    width: 218px;
  }

  .app-sidebar__brand {
    height: 58px;
    flex-basis: 58px;
    gap: 9px;
    padding-inline: 12px;
  }

  .app-sidebar__brand h1 {
    font-size: 15px;
  }

  .app-sidebar__progress {
    padding: 9px 12px;
  }

  .app-sidebar__system {
    padding-inline: 6px;
  }

  .app-sidebar__section-label {
    padding-inline: 12px;
  }
}

@media (max-height: 680px) {
  .app-sidebar__brand {
    height: 56px;
    flex-basis: 56px;
  }

  .app-sidebar__progress {
    padding-block: 8px;
  }

  .app-sidebar__footer {
    padding-block: 8px;
  }
}
</style>
