<template>
  <div class="flex-1 p-6 flex flex-col h-full overflow-hidden bg-transparent relative">
    <section
      class="rounded-[2rem] border shadow-2xl shrink-0 overflow-hidden transition-colors"
      :class="
        store.isNightMode
          ? 'bg-[#141914]/95 border-[#33463a] text-white'
          : 'bg-[#faf8f1]/95 border-[#d8d4c6] text-gray-800'
      "
    >
      <div
        class="px-6 py-6 border-b"
        :class="
          store.isNightMode
            ? 'border-white/10 bg-[linear-gradient(135deg,rgba(15,19,15,0.95),rgba(22,30,24,0.86))]'
            : 'border-[#e5dfd1] bg-[linear-gradient(135deg,rgba(251,249,244,0.95),rgba(240,237,228,0.92))]'
        "
      >
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div class="max-w-3xl">
            <div
              class="text-xs uppercase tracking-[0.28em] font-bold"
              :class="store.isNightMode ? 'text-emerald-200/60' : 'text-[#7a7f72]'"
            >
              Ranger Notes
            </div>
            <h2 class="mt-3 text-3xl font-black tracking-wide">{{ pageTitle }}</h2>
            <p
              class="mt-3 text-sm leading-7"
              :class="store.isNightMode ? 'text-gray-300' : 'text-[#625f55]'"
            >
              {{ pageDescription }}
            </p>
          </div>

          <div class="flex flex-col items-start gap-3 xl:items-end">
            <button
              v-if="currentPage !== 'home'"
              @click="goBack()"
              class="rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/25 text-gray-300 hover:text-white'
                  : 'border-[#ddd5c7] bg-white/80 text-gray-600 hover:text-gray-800'
              "
            >
              {{ backLabel }}
            </button>

            <div class="flex flex-wrap gap-2">
              <span
                v-for="crumb in breadcrumbs"
                :key="crumb"
                class="rounded-full border px-3 py-1 text-xs font-bold"
                :class="
                  store.isNightMode
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

    <div class="flex-1 overflow-y-auto pr-2 pt-4 custom-scrollbar pb-24">
      <section
        v-if="currentPage === 'home'"
        class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <button
          @click="openSection('projects')"
          class="rounded-[2rem] border p-6 text-left shadow-xl transition-all hover:-translate-y-1"
          :class="
            store.isNightMode
              ? 'bg-[#121613] border-[#33463a] hover:border-emerald-700'
              : 'bg-[#fbfaf5] border-[#ddd8cc] hover:border-emerald-300'
          "
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <div
                class="text-xs uppercase tracking-[0.24em] font-bold"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                Archive
              </div>
              <h3 class="mt-3 text-2xl font-black">项目档案</h3>
              <p
                class="mt-3 text-sm"
                :class="store.isNightMode ? 'text-gray-300' : 'text-[#5f6258]'"
              >
                按主题查看项目，再进入对应记录。
              </p>
            </div>

            <div
              class="w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shrink-0"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/25'
                  : 'border-[#e6e0d4] bg-[#fffdfa]'
              "
            >
              📁
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-6">
            <div
              class="rounded-2xl border px-4 py-4"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/20'
                  : 'border-[#e7e0d3] bg-[#fffdfa]'
              "
            >
              <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                Projects
              </div>
              <div class="mt-1 text-lg font-black">{{ store.projects.length }}</div>
            </div>
            <div
              class="rounded-2xl border px-4 py-4"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/20'
                  : 'border-[#e7e0d3] bg-[#fffdfa]'
              "
            >
              <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                Logs
              </div>
              <div class="mt-1 text-lg font-black">{{ projectLogCount }}</div>
            </div>
          </div>
        </button>

        <button
          @click="openSection('essays')"
          class="rounded-[2rem] border p-6 text-left shadow-xl transition-all hover:-translate-y-1"
          :class="
            store.isNightMode
              ? 'bg-[#15131a] border-[#4a3d62] hover:border-sky-700'
              : 'bg-[#fbf8ff] border-[#ddd2ec] hover:border-sky-300'
          "
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <div
                class="text-xs uppercase tracking-[0.24em] font-bold"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                Essays
              </div>
              <h3 class="mt-3 text-2xl font-black">巡林随笔</h3>
              <p
                class="mt-3 text-sm"
                :class="store.isNightMode ? 'text-gray-300' : 'text-[#5f6258]'"
              >
                记录项目之外的想法、阶段总结和长文表达。
              </p>
            </div>

            <div
              class="w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shrink-0"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/25'
                  : 'border-[#e6e0d4] bg-[#fffdfa]'
              "
            >
              🪶
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-6">
            <div
              class="rounded-2xl border px-4 py-4"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/20'
                  : 'border-[#e7e0d3] bg-[#fffdfa]'
              "
            >
              <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                Essays
              </div>
              <div class="mt-1 text-lg font-black">{{ essayNotes.length }}</div>
            </div>
            <div
              class="rounded-2xl border px-4 py-4"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/20'
                  : 'border-[#e7e0d3] bg-[#fffdfa]'
              "
            >
              <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                Latest
              </div>
              <div class="mt-1 text-sm font-black truncate">
                {{ essayNotes[0]?.date || '暂无随笔' }}
              </div>
            </div>
          </div>
        </button>

        <button
          @click="openSection('system')"
          class="rounded-[2rem] border p-6 text-left shadow-xl transition-all hover:-translate-y-1"
          :class="
            store.isNightMode
              ? 'bg-[#17120d] border-[#4f3f28] hover:border-amber-700'
              : 'bg-[#fff8ee] border-[#ead6b2] hover:border-amber-300'
          "
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <div
                class="text-xs uppercase tracking-[0.24em] font-bold"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                System
              </div>
              <h3 class="mt-3 text-2xl font-black">系统记录</h3>
              <p
                class="mt-3 text-sm"
                :class="store.isNightMode ? 'text-gray-300' : 'text-[#7a6853]'"
              >
                查看合并、删除等系统事件。
              </p>
            </div>

            <div
              class="w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shrink-0"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/25'
                  : 'border-[#eddcc0] bg-white/70'
              "
            >
              📜
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-6">
            <div
              class="rounded-2xl border px-4 py-4"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/20'
                  : 'border-[#eddcc0] bg-white/70'
              "
            >
              <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                Records
              </div>
              <div class="mt-1 text-lg font-black">{{ systemLogs.length }}</div>
            </div>
            <div
              class="rounded-2xl border px-4 py-4"
              :class="
                store.isNightMode
                  ? 'border-white/10 bg-black/20'
                  : 'border-[#eddcc0] bg-white/70'
              "
            >
              <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                Latest
              </div>
              <div class="mt-1 text-sm font-black truncate">
                {{ systemLogs[0]?.date || '暂无记录' }}
              </div>
            </div>
          </div>
        </button>
      </section>

      <section
        v-else-if="currentPage === 'project-list'"
        class="rounded-[2rem] border shadow-xl overflow-hidden"
        :class="
          store.isNightMode
            ? 'bg-[#121613] border-[#33463a]'
            : 'bg-[#fbfaf5] border-[#ddd8cc]'
        "
      >
        <div
          class="px-6 py-5 border-b"
          :class="
            store.isNightMode
              ? 'border-white/10 bg-black/15'
              : 'border-[#e5dfd1] bg-white/60'
          "
        >
          <div class="flex flex-wrap gap-2">
            <button
              v-for="theme in themeOptions"
              :key="theme.id"
              @click="selectedThemeId = theme.id"
              class="rounded-full border px-4 py-2 text-sm font-bold transition-all"
              :class="themeTabClass(theme.id)"
            >
              {{ theme.label }}
              <span class="ml-2 opacity-70">{{ theme.projectCount }}</span>
            </button>
          </div>
        </div>

        <div v-if="filteredProjects.length === 0" class="px-6 py-16 text-center">
          <div class="text-4xl mb-3">🗂️</div>
          <p class="font-semibold">{{ currentThemeLabel }}下还没有项目。</p>
        </div>

        <div v-else class="grid gap-4 p-6 md:grid-cols-2 2xl:grid-cols-3">
          <button
            v-for="project in filteredProjects"
            :key="project.id"
            @click="openProject(project.id)"
            class="rounded-[1.75rem] border p-5 text-left transition-all hover:-translate-y-1"
            :class="
              store.isNightMode
                ? 'border-white/10 bg-[#171d18] hover:border-emerald-800'
                : 'border-white/80 bg-white/85 hover:border-emerald-200'
            "
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div
                  class="text-[11px] uppercase tracking-[0.2em] font-bold"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  {{ getThemeLabel(project.themeId) }}
                </div>
                <h4 class="mt-2 text-xl font-black truncate">{{ project.name }}</h4>
              </div>
              <div
                class="w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl shrink-0"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/25'
                    : 'border-[#e6e0d4] bg-[#fffdfa]'
                "
              >
                {{ project.icon || '📁' }}
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 mt-5">
              <div
                class="rounded-2xl border px-3 py-3"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/20'
                    : 'border-[#e7e0d3] bg-[#fffdfa]'
                "
              >
                <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                  Level
                </div>
                <div class="mt-1 text-sm font-black">Lv. {{ project.level }}</div>
              </div>
              <div
                class="rounded-2xl border px-3 py-3"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/20'
                    : 'border-[#e7e0d3] bg-[#fffdfa]'
                "
              >
                <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                  Trees
                </div>
                <div class="mt-1 text-sm font-black">{{ project.totalTrees }}</div>
              </div>
              <div
                class="rounded-2xl border px-3 py-3"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/20'
                    : 'border-[#e7e0d3] bg-[#fffdfa]'
                "
              >
                <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                  Logs
                </div>
                <div class="mt-1 text-sm font-black">{{ projectNoteCount(project.id) }}</div>
              </div>
            </div>

            <div
              class="mt-5 flex items-center justify-between text-sm"
              :class="store.isNightMode ? 'text-gray-300' : 'text-[#5f6258]'"
            >
              <span>{{ formatDuration(project.totalTimeSpent) }}</span>
              <span class="font-bold">进入 →</span>
            </div>
          </button>
        </div>
      </section>

      <section
        v-else-if="currentPage === 'essay-list'"
        class="rounded-[2rem] border shadow-xl overflow-hidden"
        :class="
          store.isNightMode
            ? 'bg-[#15131a] border-[#4a3d62]'
            : 'bg-[#fbf8ff] border-[#ddd2ec]'
        "
      >
        <div
          class="px-6 py-5 border-b flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          :class="
            store.isNightMode
              ? 'border-white/10 bg-black/15'
              : 'border-[#e7def2] bg-white/60'
          "
        >
          <div class="flex-1 space-y-4">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="scope in essayScopeOptions"
                :key="scope.id"
                @click="selectedEssayScope = scope.id"
                class="rounded-full border px-4 py-2 text-sm font-bold transition-all"
                :class="essayScopeClass(scope.id)"
              >
                {{ scope.label }}
                <span class="ml-2 opacity-70">{{ scope.count }}</span>
              </button>
            </div>

            <div class="relative max-w-xl">
              <input
                v-model="essaySearchQuery"
                type="text"
                placeholder="搜索标题或正文"
                class="w-full rounded-full border px-4 py-2.5 pr-10 text-sm outline-none transition-colors"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/20 text-white placeholder:text-gray-500 focus:border-sky-700'
                    : 'border-[#ddd5e8] bg-white/90 text-gray-800 placeholder:text-gray-400 focus:border-sky-300'
                "
              />
              <button
                v-if="essaySearchQuery"
                @click="essaySearchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold transition-colors"
                :class="store.isNightMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'"
              >
                清除
              </button>
            </div>
          </div>

          <button
            @click="startEssayCreate"
            class="rounded-full px-4 py-2 text-sm font-bold text-white shadow transition-colors"
            :class="store.isNightMode ? 'bg-sky-700 hover:bg-sky-600' : 'bg-sky-600 hover:bg-sky-500'"
          >
            + 新建随笔
          </button>
        </div>

        <div v-if="filteredEssayNotes.length === 0" class="px-6 py-16 text-center">
          <div class="text-4xl mb-3">🪶</div>
          <p class="font-semibold">
            {{ essaySearchQuery ? '没有找到匹配的巡林随笔。' : '还没有巡林随笔。' }}
          </p>
          <p
            class="mt-2 text-sm"
            :class="store.isNightMode ? 'text-gray-400' : 'text-[#6f6a60]'"
          >
            {{
              essaySearchQuery
                ? '试试更短的关键词，或者切换到别的项目范围。'
                : '当你想记录阶段想法、灵感片段或项目总结时，可以从这里开始。'
            }}
          </p>
        </div>

        <div v-else class="grid gap-4 p-6 md:grid-cols-2 2xl:grid-cols-3">
          <button
            v-for="note in filteredEssayNotes"
            :key="note.id"
            @click="openEssay(note.id)"
            class="rounded-[1.75rem] border p-5 text-left transition-all hover:-translate-y-1"
            :class="
              store.isNightMode
                ? 'border-white/10 bg-[#181421] hover:border-sky-800'
                : 'border-white/80 bg-white/85 hover:border-sky-200'
            "
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-full border px-2.5 py-1 text-[11px] font-bold"
                    :class="
                      store.isNightMode
                        ? 'border-sky-900 bg-sky-900/20 text-sky-300'
                        : 'border-sky-200 bg-sky-50 text-sky-700'
                    "
                  >
                    巡林随笔
                  </span>
                  <span
                    class="rounded-full border px-2.5 py-1 text-[11px] font-bold"
                    :class="
                      store.isNightMode
                        ? 'border-white/10 bg-black/20 text-gray-300'
                        : 'border-[#e3dbef] bg-[#faf8ff] text-[#6a617a]'
                    "
                  >
                    {{ essayProjectLabel(note) }}
                  </span>
                </div>
                <h4 class="mt-3 text-xl font-black break-words">{{ note.title }}</h4>
              </div>
              <div
                class="w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl shrink-0"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/25'
                    : 'border-[#e6e0d4] bg-[#fffdfa]'
                "
              >
                🪶
              </div>
            </div>

            <p
              class="mt-4 text-sm leading-6 line-clamp-4"
              :class="store.isNightMode ? 'text-gray-300' : 'text-[#5b594f]'"
            >
              {{ notePreview(note.content) }}
            </p>

            <div class="mt-5 flex items-center justify-between text-xs"
                 :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
              <span>更新于 {{ note.date }}</span>
              <span>字数 {{ note.wordCount }}</span>
            </div>
          </button>
        </div>
      </section>

      <section
        v-else-if="currentPage === 'system-list'"
        class="rounded-[2rem] border shadow-xl overflow-hidden"
        :class="
          store.isNightMode
            ? 'bg-[#17120d] border-[#4f3f28]'
            : 'bg-[#fff8ee] border-[#ead6b2]'
        "
      >
        <div v-if="systemLogs.length === 0" class="px-6 py-16 text-center">
          <div class="text-4xl mb-3">📜</div>
          <p class="font-semibold">当前还没有系统记录。</p>
        </div>

        <div v-else class="space-y-4 p-6">
          <button
            v-for="note in systemLogs"
            :key="note.id"
            @click="openSystemNote(note.id)"
            class="w-full rounded-2xl border p-5 text-left transition-all"
            :class="systemListCardClass"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    class="text-[11px] px-2 py-1 rounded-full border font-bold uppercase tracking-wide"
                    :class="
                      store.isNightMode
                        ? 'text-amber-300 border-amber-900 bg-amber-900/20'
                        : 'text-amber-700 border-amber-200 bg-amber-50'
                    "
                  >
                    系统记录
                  </span>
                  <span
                    v-if="systemEventLabel(note.eventType)"
                    class="text-[11px] px-2 py-1 rounded-full border font-bold"
                    :class="
                      store.isNightMode
                        ? 'text-amber-200 border-white/10 bg-black/20'
                        : 'text-amber-700 border-[#eddcc0] bg-white/70'
                    "
                  >
                    {{ systemEventLabel(note.eventType) }}
                  </span>
                </div>
                <h4 class="text-lg font-black break-words">{{ note.title }}</h4>
                <p
                  class="mt-2 text-sm line-clamp-2"
                  :class="store.isNightMode ? 'text-amber-100/80' : 'text-amber-900/80'"
                >
                  {{ notePreview(note.content) }}
                </p>
              </div>

              <span
                class="text-xs shrink-0"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                {{ note.date }}
              </span>
            </div>
          </button>
        </div>
      </section>

      <section
        v-else-if="currentPage === 'essay-detail'"
        class="rounded-[2rem] border shadow-xl overflow-hidden"
        :class="
          store.isNightMode
            ? 'bg-[#15131a] border-[#4a3d62]'
            : 'bg-[#fbf8ff] border-[#ddd2ec]'
        "
      >
        <div
          class="px-6 py-5 border-b"
          :class="
            store.isNightMode
              ? 'border-white/10 bg-black/15'
              : 'border-[#e7def2] bg-white/60'
          "
        >
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full border px-2.5 py-1 text-[11px] font-bold"
                  :class="
                    store.isNightMode
                      ? 'border-sky-900 bg-sky-900/20 text-sky-300'
                      : 'border-sky-200 bg-sky-50 text-sky-700'
                  "
                >
                  巡林随笔
                </span>
                <span
                  v-if="!isEssayCreating"
                  class="rounded-full border px-2.5 py-1 text-[11px] font-bold"
                  :class="
                    store.isNightMode
                      ? 'border-white/10 bg-black/20 text-gray-300'
                      : 'border-[#e3dbef] bg-[#faf8ff] text-[#6a617a]'
                  "
                >
                  {{ selectedEssayNote ? essayProjectLabel(selectedEssayNote) : '未关联项目' }}
                </span>
              </div>

              <template v-if="essayEditorMode === 'rename' && selectedEssayNote">
                <div class="mt-4 flex flex-col gap-3 md:flex-row">
                  <input
                    v-model="essayRenameDraft"
                    type="text"
                    class="w-full rounded-xl px-4 py-3 border outline-none transition-colors"
                    :class="
                      store.isNightMode
                        ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-sky-500'
                        : 'bg-white border-gray-300 text-gray-800 focus:border-sky-400'
                    "
                  />
                  <div class="flex gap-2">
                    <button
                      @click="saveEssayRename"
                      class="rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors"
                      :class="store.isNightMode ? 'bg-sky-700 hover:bg-sky-600' : 'bg-sky-600 hover:bg-sky-500'"
                    >
                      保存标题
                    </button>
                    <button
                      @click="cancelEssayRename"
                      class="rounded-xl px-4 py-3 text-sm font-bold transition-colors"
                      :class="store.isNightMode ? 'bg-white/10 text-gray-300 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-800'"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </template>

              <template v-else>
                <h3 class="mt-3 text-2xl font-black break-words">
                  {{ isEssayCreating ? '新建巡林随笔' : selectedEssayNote?.title }}
                </h3>
                <p
                  class="mt-2 text-sm"
                  :class="store.isNightMode ? 'text-gray-300' : 'text-[#5f6258]'"
                >
                  {{ isEssayCreating ? '写下阶段思考、灵感和总结。' : `更新于 ${selectedEssayNote?.date || ''}` }}
                </p>
              </template>
            </div>

            <div class="flex flex-wrap gap-2">
              <template v-if="essayEditorMode === 'view' && selectedEssayNote">
                <button
                  @click="startEssayRename"
                  class="rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
                  :class="
                    store.isNightMode
                      ? 'border-white/10 bg-black/25 text-gray-300 hover:text-white'
                      : 'border-[#ddd5c7] bg-white/80 text-gray-600 hover:text-gray-800'
                  "
                >
                  重命名
                </button>
                <button
                  @click="startEssayEdit"
                  class="rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
                  :class="
                    store.isNightMode
                      ? 'border-sky-900 bg-sky-900/20 text-sky-300 hover:text-white'
                      : 'border-sky-200 bg-sky-50 text-sky-700 hover:text-sky-800'
                  "
                >
                  编辑
                </button>
                <button
                  @click="deleteEssay(selectedEssayNote.id)"
                  class="rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
                  :class="
                    store.isNightMode
                      ? 'border-red-900 bg-red-900/20 text-red-300 hover:text-white'
                      : 'border-red-200 bg-red-50 text-red-600 hover:text-red-700'
                  "
                >
                  删除
                </button>
              </template>
            </div>
          </div>
        </div>

        <template v-if="essayEditorMode === 'create' || essayEditorMode === 'edit'">
          <div class="p-6">
            <div class="grid gap-4 lg:grid-cols-[1fr_240px]">
              <div class="space-y-4">
                <div class="space-y-1">
                  <label
                    class="text-xs font-bold uppercase tracking-wider"
                    :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                  >
                    标题
                  </label>
                  <input
                    v-model="essayDraft.title"
                    type="text"
                    class="w-full rounded-xl px-4 py-3 border outline-none transition-colors"
                    :class="
                      store.isNightMode
                        ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-sky-500'
                        : 'bg-white border-gray-300 text-gray-800 focus:border-sky-400'
                    "
                  />
                </div>

                <div class="space-y-1">
                  <label
                    class="text-xs font-bold uppercase tracking-wider"
                    :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                  >
                    正文
                  </label>
                  <textarea
                    v-model="essayDraft.content"
                    class="w-full h-72 rounded-xl px-4 py-3 border outline-none resize-none transition-colors"
                    :class="
                      store.isNightMode
                        ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-sky-500'
                        : 'bg-white border-gray-300 text-gray-800 focus:border-sky-400'
                    "
                  ></textarea>
                </div>
              </div>

              <div class="space-y-4">
                <div class="space-y-1">
                  <label
                    class="text-xs font-bold uppercase tracking-wider"
                    :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                  >
                    关联项目
                  </label>
                  <select
                    v-model="essayDraft.projectId"
                    class="w-full rounded-xl px-4 py-3 border outline-none transition-colors"
                    :class="
                      store.isNightMode
                        ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-sky-500'
                        : 'bg-white border-gray-300 text-gray-800 focus:border-sky-400'
                    "
                  >
                    <option
                      v-for="project in editableProjectOptions"
                      :key="project.id"
                      :value="project.id"
                    >
                      {{ project.label }}
                    </option>
                  </select>
                </div>

                <div
                  class="rounded-xl border p-4 text-sm"
                  :class="
                    store.isNightMode
                      ? 'border-gray-800 bg-[#0c0c0c] text-gray-400'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  "
                >
                  巡林随笔不会自动奖励金币，它只服务于表达、整理和沉淀。
                </div>

                <div class="flex flex-col gap-2">
                  <button
                    @click="saveEssayDraft"
                    class="w-full py-3 rounded-xl font-bold text-white transition-colors"
                    :class="store.isNightMode ? 'bg-sky-700 hover:bg-sky-600' : 'bg-sky-600 hover:bg-sky-500'"
                  >
                    {{ essayEditorMode === 'create' ? '创建随笔' : '保存修改' }}
                  </button>
                  <button
                    @click="cancelEssayEditor"
                    class="w-full py-3 rounded-xl font-bold transition-colors"
                    :class="store.isNightMode ? 'bg-white/10 text-gray-300 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-800'"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="selectedEssayNote">
          <div class="p-6">
            <div
              class="text-sm whitespace-pre-wrap leading-relaxed"
              :class="store.isNightMode ? 'text-gray-200' : 'text-[#5b594f]'"
            >
              {{ selectedEssayNote.content || '暂无内容' }}
            </div>

            <div class="mt-6 flex flex-wrap gap-2 text-xs">
              <span
                class="px-2 py-1 rounded-full border"
                :class="
                  store.isNightMode
                    ? 'border-gray-700 text-gray-400 bg-black/20'
                    : 'border-gray-200 text-gray-500 bg-gray-50'
                "
              >
                字数 {{ selectedEssayNote.wordCount }}
              </span>
              <span
                class="px-2 py-1 rounded-full border"
                :class="
                  store.isNightMode
                    ? 'border-white/10 text-gray-300 bg-black/20'
                    : 'border-[#e3dbef] bg-[#faf8ff] text-[#6a617a]'
                "
              >
                {{ essayProjectLabel(selectedEssayNote) }}
              </span>
            </div>
          </div>
        </template>
      </section>

      <section
        v-else-if="currentPage === 'project-detail' && selectedProject"
        class="rounded-[2rem] border shadow-xl overflow-hidden"
        :class="
          store.isNightMode
            ? 'bg-[#121613] border-[#33463a]'
            : 'bg-[#fbfaf5] border-[#ddd8cc]'
        "
      >
        <div
          class="px-6 py-5 border-b"
          :class="
            store.isNightMode
              ? 'border-white/10 bg-black/15'
              : 'border-[#e5dfd1] bg-white/60'
          "
        >
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div
                class="text-xs uppercase tracking-[0.24em] font-bold"
                :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
              >
                {{ getThemeLabel(selectedProject.themeId) }}
              </div>
              <h3 class="mt-2 text-2xl font-black">{{ selectedProject.name }}</h3>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:min-w-[32rem] xl:grid-cols-4">
              <div
                class="rounded-2xl border px-4 py-4"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/25'
                    : 'border-[#e1dbcf] bg-white/80'
                "
              >
                <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                  Level
                </div>
                <div class="mt-1 text-lg font-black">Lv. {{ selectedProject.level }}</div>
              </div>
              <div
                class="rounded-2xl border px-4 py-4"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/25'
                    : 'border-[#e1dbcf] bg-white/80'
                "
              >
                <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                  Trees
                </div>
                <div class="mt-1 text-lg font-black">{{ selectedProject.totalTrees }}</div>
              </div>
              <div
                class="rounded-2xl border px-4 py-4"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/25'
                    : 'border-[#e1dbcf] bg-white/80'
                "
              >
                <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                  Records
                </div>
                <div class="mt-1 text-lg font-black">{{ projectLogs.length }}</div>
              </div>
              <div
                class="rounded-2xl border px-4 py-4"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/25'
                    : 'border-[#e1dbcf] bg-white/80'
                "
              >
                <div class="text-[11px] uppercase tracking-[0.18em] font-bold opacity-60">
                  Essays
                </div>
                <div class="mt-1 text-lg font-black">{{ projectEssayLogs.length }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="projectLogs.length === 0" class="px-6 py-16 text-center">
          <div class="text-4xl mb-3">🌱</div>
          <p class="font-semibold">该项目还没有记录。</p>
        </div>

        <div v-else class="space-y-8 p-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div
                  class="text-xs uppercase tracking-[0.24em] font-bold"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  Planting
                </div>
                <h4 class="mt-1 text-xl font-black">植树记录</h4>
              </div>
              <span
                class="rounded-full border px-3 py-1 text-xs font-bold"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-black/20 text-gray-300'
                    : 'border-[#e5dfd1] bg-white/80 text-gray-600'
                "
              >
                {{ projectPlantingLogs.length }} 条
              </span>
            </div>

            <div v-if="projectPlantingLogs.length === 0" class="rounded-2xl border px-5 py-10 text-center"
                 :class="store.isNightMode ? 'border-white/10 bg-black/15' : 'border-[#e5dfd1] bg-white/75'">
              <p class="font-semibold">这个项目还没有植树记录。</p>
            </div>

            <div v-else class="space-y-4">
              <article
                v-for="note in projectPlantingLogs"
                :key="note.id"
                class="rounded-2xl border shadow-sm transition-all overflow-hidden"
                :class="noteCardClass(note)"
              >
                <template v-if="editingNoteId === note.id">
                  <div class="p-5 space-y-4">
                    <div class="flex justify-between items-start gap-4">
                      <div>
                        <div
                          class="text-xs uppercase tracking-widest font-bold mb-1"
                          :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                        >
                          编辑记录
                        </div>
                        <h4 class="text-lg font-black">修改内容</h4>
                      </div>
                      <button
                        @click="cancelEditing"
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

                    <div class="grid gap-4 lg:grid-cols-[1fr_220px]">
                      <div class="space-y-3">
                        <div class="space-y-1">
                          <label
                            class="text-xs font-bold uppercase tracking-wider"
                            :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                          >
                            标题
                          </label>
                          <input
                            v-model="editDraft.title"
                            type="text"
                            class="w-full rounded-xl px-4 py-3 border outline-none transition-colors"
                            :class="
                              store.isNightMode
                                ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-emerald-500'
                                : 'bg-white border-gray-300 text-gray-800 focus:border-emerald-400'
                            "
                          />
                        </div>

                        <div class="space-y-1">
                          <label
                            class="text-xs font-bold uppercase tracking-wider"
                            :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                          >
                            内容
                          </label>
                          <textarea
                            v-model="editDraft.content"
                            class="w-full h-36 rounded-xl px-4 py-3 border outline-none resize-none transition-colors"
                            :class="
                              store.isNightMode
                                ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-emerald-500'
                                : 'bg-white border-gray-300 text-gray-800 focus:border-emerald-400'
                            "
                          ></textarea>
                        </div>
                      </div>

                      <div class="space-y-3">
                        <div class="space-y-1">
                          <label
                            class="text-xs font-bold uppercase tracking-wider"
                            :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                          >
                            所属项目
                          </label>
                          <select
                            v-model="editDraft.projectId"
                            class="w-full rounded-xl px-4 py-3 border outline-none transition-colors"
                            :class="
                              store.isNightMode
                                ? 'bg-[#0c0c0c] border-gray-700 text-white focus:border-emerald-500'
                                : 'bg-white border-gray-300 text-gray-800 focus:border-emerald-400'
                            "
                          >
                            <option
                              v-for="project in editableProjectOptions"
                              :key="project.id"
                              :value="project.id"
                            >
                              {{ project.label }}
                            </option>
                          </select>
                        </div>

                        <div
                          class="rounded-xl border p-3 text-sm"
                          :class="
                            store.isNightMode
                              ? 'border-gray-800 bg-[#0c0c0c] text-gray-400'
                              : 'border-gray-200 bg-gray-50 text-gray-500'
                          "
                        >
                          修改内容不会重复结算金币或经验。
                        </div>

                        <button
                          @click="saveEditing(note.id)"
                          class="w-full py-3 rounded-xl font-bold transition-colors"
                          :class="
                            store.isNightMode
                              ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          "
                        >
                          保存修改
                        </button>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="p-5">
                    <div class="flex justify-between items-start gap-4 mb-4">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            class="text-[11px] px-2 py-1 rounded-full border font-bold uppercase tracking-wide"
                            :class="noteBadgeClass(note)"
                          >
                            {{ noteTypeLabel(note.type) }}
                          </span>
                        </div>
                        <h4 class="text-lg font-black break-words">{{ note.title }}</h4>
                      </div>

                      <div class="flex items-start gap-2 shrink-0">
                        <span
                          class="text-xs mt-1"
                          :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                        >
                          {{ note.date }}
                        </span>
                        <button
                          @click="startEditing(note)"
                          class="text-xs px-3 py-1 rounded-full border transition-colors"
                          :class="
                            store.isNightMode
                              ? 'border-gray-700 text-blue-300 hover:text-white'
                              : 'border-blue-200 text-blue-600 hover:text-blue-700'
                          "
                        >
                          编辑
                        </button>
                        <button
                          @click="store.deleteNote(note.id)"
                          class="text-xs px-3 py-1 rounded-full border transition-colors"
                          :class="
                            store.isNightMode
                              ? 'border-gray-700 text-red-300 hover:text-white'
                              : 'border-red-200 text-red-500 hover:text-red-600'
                          "
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    <div
                      class="text-sm whitespace-pre-wrap leading-relaxed"
                      :class="store.isNightMode ? 'text-gray-200' : 'text-[#5b594f]'"
                    >
                      {{ note.content || '暂无内容' }}
                    </div>

                    <div class="mt-4 flex flex-wrap gap-2 text-xs">
                      <span
                        class="px-2 py-1 rounded-full border"
                        :class="
                          store.isNightMode
                            ? 'border-gray-700 text-gray-400 bg-black/20'
                            : 'border-gray-200 text-gray-500 bg-gray-50'
                        "
                      >
                        字数 {{ note.wordCount }}
                      </span>
                      <span
                        class="px-2 py-1 rounded-full border"
                        :class="
                          store.isNightMode
                            ? 'border-gray-700 text-gray-400 bg-black/20'
                            : 'border-gray-200 text-gray-500 bg-gray-50'
                        "
                      >
                        金币 +{{ note.coins }}
                      </span>
                    </div>
                  </div>
                </template>
              </article>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div
                  class="text-xs uppercase tracking-[0.24em] font-bold"
                  :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                >
                  Essays
                </div>
                <h4 class="mt-1 text-xl font-black">关联随笔</h4>
              </div>
              <button
                @click="startEssayCreateWithProject(selectedProject.id)"
                class="rounded-full px-4 py-2 text-sm font-bold text-white shadow transition-colors"
                :class="store.isNightMode ? 'bg-sky-700 hover:bg-sky-600' : 'bg-sky-600 hover:bg-sky-500'"
              >
                + 写一篇随笔
              </button>
            </div>

            <div v-if="projectEssayLogs.length === 0" class="rounded-2xl border px-5 py-10 text-center"
                 :class="store.isNightMode ? 'border-white/10 bg-black/15' : 'border-[#e5dfd1] bg-white/75'">
              <p class="font-semibold">这个项目还没有关联随笔。</p>
              <p
                class="mt-2 text-sm"
                :class="store.isNightMode ? 'text-gray-400' : 'text-[#6f6a60]'"
              >
                如果你想写阶段总结、灵感片段或复盘，可以直接从这里开始。
              </p>
            </div>

            <div v-else class="grid gap-4 xl:grid-cols-2">
              <button
                v-for="note in projectEssayLogs"
                :key="note.id"
                @click="openEssay(note.id)"
                class="rounded-[1.5rem] border p-5 text-left transition-all hover:-translate-y-1"
                :class="
                  store.isNightMode
                    ? 'border-white/10 bg-[#181421] hover:border-sky-800'
                    : 'border-white/80 bg-white/85 hover:border-sky-200'
                "
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <span
                      class="rounded-full border px-2.5 py-1 text-[11px] font-bold"
                      :class="
                        store.isNightMode
                          ? 'border-sky-900 bg-sky-900/20 text-sky-300'
                          : 'border-sky-200 bg-sky-50 text-sky-700'
                      "
                    >
                      巡林随笔
                    </span>
                    <h5 class="mt-3 text-lg font-black break-words">{{ note.title }}</h5>
                  </div>
                  <span
                    class="text-xs shrink-0"
                    :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
                  >
                    {{ note.date }}
                  </span>
                </div>

                <p
                  class="mt-4 text-sm leading-6 line-clamp-4"
                  :class="store.isNightMode ? 'text-gray-300' : 'text-[#5b594f]'"
                >
                  {{ notePreview(note.content) }}
                </p>

                <div class="mt-5 flex items-center justify-between text-xs"
                     :class="store.isNightMode ? 'text-gray-400' : 'text-gray-500'">
                  <span>字数 {{ note.wordCount }}</span>
                  <span class="font-bold">查看随笔 →</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        v-else-if="currentPage === 'system-detail' && selectedSystemNote"
        class="rounded-[2rem] border shadow-xl overflow-hidden"
        :class="
          store.isNightMode
            ? 'bg-[#17120d] border-[#4f3f28]'
            : 'bg-[#fff8ee] border-[#ead6b2]'
        "
      >
        <div
          class="px-6 py-5 border-b"
          :class="
            store.isNightMode
              ? 'border-white/10 bg-black/20'
              : 'border-[#eddcc0] bg-white/60'
          "
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="text-[11px] px-2 py-1 rounded-full border font-bold uppercase tracking-wide"
                  :class="
                    store.isNightMode
                      ? 'text-amber-300 border-amber-900 bg-amber-900/20'
                      : 'text-amber-700 border-amber-200 bg-amber-50'
                  "
                >
                  系统记录
                </span>
                <span
                  v-if="systemEventLabel(selectedSystemNote.eventType)"
                  class="text-[11px] px-2 py-1 rounded-full border font-bold"
                  :class="
                    store.isNightMode
                      ? 'text-amber-200 border-white/10 bg-black/20'
                      : 'text-amber-700 border-[#eddcc0] bg-white/70'
                  "
                >
                  {{ systemEventLabel(selectedSystemNote.eventType) }}
                </span>
              </div>
              <h3 class="mt-3 text-2xl font-black">{{ selectedSystemNote.title }}</h3>
            </div>

            <span
              class="text-xs shrink-0"
              :class="store.isNightMode ? 'text-gray-500' : 'text-gray-400'"
            >
              {{ selectedSystemNote.date }}
            </span>
          </div>
        </div>

        <div class="p-6">
          <div
            class="text-sm whitespace-pre-wrap leading-relaxed"
            :class="store.isNightMode ? 'text-amber-100' : 'text-amber-900'"
          >
            {{ selectedSystemNote.content || '暂无内容' }}
          </div>

          <div class="mt-4 flex flex-wrap gap-2 text-xs">
            <span
              v-if="selectedSystemNote.projectIds?.length"
              class="px-2 py-1 rounded-full border"
              :class="
                store.isNightMode
                  ? 'border-blue-900 text-blue-300 bg-blue-900/20'
                  : 'border-blue-200 text-blue-700 bg-blue-50'
              "
            >
              {{ getProjectNames(selectedSystemNote.projectIds) }}
            </span>
            <span
              class="px-2 py-1 rounded-full border"
              :class="
                store.isNightMode
                  ? 'border-gray-700 text-gray-400 bg-black/20'
                  : 'border-gray-200 text-gray-500 bg-gray-50'
              "
            >
              系统生成
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { alertDialog, confirmDialog } from '@/composables/dialogService'
import { useGameStore } from '@/stores/gameStore'

const UNCATEGORIZED_THEME_ID = '__uncategorized__'

const store = useGameStore()

const currentPage = ref('home')
const selectedThemeId = ref('all')
const selectedProjectId = ref(null)
const selectedEssayNoteId = ref(null)
const selectedSystemNoteId = ref(null)
const editingNoteId = ref(null)
const essaySearchQuery = ref('')
const editDraft = reactive({
  title: '',
  content: '',
  projectId: 'all'
})
const essayEditorMode = ref('view')
const essayRenameDraft = ref('')
const essayDraft = reactive({
  title: '',
  content: '',
  projectId: 'all'
})

const uncategorizedProjects = computed(() =>
  store.projects.filter(project => !project.themeId)
)

const themeOptions = computed(() => {
  const options = [
    {
      id: 'all',
      label: '全部',
      projectCount: store.projects.length
    }
  ]

  store.themes.forEach(theme => {
    options.push({
      id: theme.id,
      label: theme.name,
      projectCount: store.projects.filter(project => project.themeId === theme.id).length
    })
  })

  if (uncategorizedProjects.value.length > 0) {
    options.push({
      id: UNCATEGORIZED_THEME_ID,
      label: '未分类',
      projectCount: uncategorizedProjects.value.length
    })
  }

  return options
})

const filteredProjects = computed(() => {
  if (selectedThemeId.value === 'all') return store.projects
  if (selectedThemeId.value === UNCATEGORIZED_THEME_ID) return uncategorizedProjects.value
  return store.projects.filter(project => project.themeId === selectedThemeId.value)
})

const selectedProject = computed(
  () => store.projects.find(project => project.id === selectedProjectId.value) || null
)

const selectedEssayNote = computed(
  () => essayNotes.value.find(note => note.id === selectedEssayNoteId.value) || null
)

const selectedSystemNote = computed(
  () => systemLogs.value.find(note => note.id === selectedSystemNoteId.value) || null
)

const editableProjectOptions = computed(() =>
  [
    {
      id: 'all',
      label: '不关联项目'
    },
    ...store.projects.map(project => ({
      id: project.id,
      label: project.name
    }))
  ]
)

const currentThemeLabel = computed(() => {
  const theme = themeOptions.value.find(option => option.id === selectedThemeId.value)
  return theme ? theme.label : '全部'
})

const projectLogs = computed(() => {
  if (!selectedProject.value) return []
  return store.notebook.filter(note => {
    const noteInProject = note.projectIds?.includes(selectedProject.value.id)
    return noteInProject && note.type !== 'system'
  })
})

const projectPlantingLogs = computed(() =>
  projectLogs.value.filter(note => note.type === 'planting')
)

const projectEssayLogs = computed(() =>
  projectLogs.value.filter(note => note.type === 'essay')
)

const systemLogs = computed(() =>
  store.notebook.filter(note => note.type === 'system')
)

const essayNotes = computed(() =>
  [...store.notebook]
    .filter(note => note.type === 'essay' && note.source !== 'system')
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
)

const selectedEssayScope = ref('all')

const essayScopeOptions = computed(() => {
  const options = [
    {
      id: 'all',
      label: '全部',
      count: essayNotes.value.length
    },
    {
      id: 'global',
      label: '未关联',
      count: essayNotes.value.filter(note => !note.projectIds?.length).length
    }
  ]

  store.projects.forEach(project => {
    const count = essayNotes.value.filter(note => note.projectIds?.includes(project.id)).length
    if (count > 0) {
      options.push({
        id: project.id,
        label: project.name,
        count
      })
    }
  })

  return options
})

const scopedEssayNotes = computed(() => {
  if (selectedEssayScope.value === 'all') return essayNotes.value
  if (selectedEssayScope.value === 'global') {
    return essayNotes.value.filter(note => !note.projectIds?.length)
  }
  return essayNotes.value.filter(note => note.projectIds?.includes(selectedEssayScope.value))
})

const filteredEssayNotes = computed(() => {
  const keyword = essaySearchQuery.value.trim().toLowerCase()
  if (!keyword) return scopedEssayNotes.value

  return scopedEssayNotes.value.filter(note =>
    [note.title, note.content, essayProjectLabel(note)]
      .filter(Boolean)
      .some(field => field.toLowerCase().includes(keyword))
  )
})

const projectLogCount = computed(() =>
  store.notebook.filter(note => note.type !== 'system').length
)

const isEssayCreating = computed(() => essayEditorMode.value === 'create')

const pageTitle = computed(() => {
  if (currentPage.value === 'project-list') return '项目档案'
  if (currentPage.value === 'project-detail') return selectedProject.value?.name || '项目档案'
  if (currentPage.value === 'essay-list') return '巡林随笔'
  if (currentPage.value === 'essay-detail') {
    if (essayEditorMode.value === 'create') return '新建巡林随笔'
    return selectedEssayNote.value?.title || '巡林随笔'
  }
  if (currentPage.value === 'system-list') return '系统记录'
  if (currentPage.value === 'system-detail') return selectedSystemNote.value?.title || '系统记录'
  return '巡林官手记'
})

const pageDescription = computed(() => {
  if (currentPage.value === 'project-list') return '按主题查看项目。'
  if (currentPage.value === 'project-detail') return '浏览这个项目的全部记录。'
  if (currentPage.value === 'essay-list') return '记录项目过程中的想法、总结和灵感。'
  if (currentPage.value === 'essay-detail') {
    return essayEditorMode.value === 'create'
      ? '写下一篇新的巡林随笔。'
      : '查看或修改这篇巡林随笔。'
  }
  if (currentPage.value === 'system-list') return '查看系统生成的事件记录。'
  if (currentPage.value === 'system-detail') return '查看这条系统记录的完整内容。'
  return '选择一个栏目进入。'
})

const breadcrumbs = computed(() => {
  if (currentPage.value === 'project-list') return ['栏目', '项目档案']
  if (currentPage.value === 'project-detail') {
    return ['项目档案', selectedProject.value?.name || '项目']
  }
  if (currentPage.value === 'essay-list') return ['栏目', '巡林随笔']
  if (currentPage.value === 'essay-detail') {
    return ['巡林随笔', essayEditorMode.value === 'create' ? '新建' : selectedEssayNote.value?.title || '详情']
  }
  if (currentPage.value === 'system-list') return ['栏目', '系统记录']
  if (currentPage.value === 'system-detail') {
    return ['系统记录', selectedSystemNote.value?.title || '详情']
  }
  return ['栏目']
})

const backLabel = computed(() => {
  if (currentPage.value === 'project-detail') return '← 返回项目列表'
  if (currentPage.value === 'essay-detail') return '← 返回随笔列表'
  if (currentPage.value === 'system-detail') return '← 返回系统记录'
  return '← 返回栏目'
})

watch(selectedThemeId, () => {
  if (
    currentPage.value === 'project-detail' &&
    !filteredProjects.value.some(project => project.id === selectedProjectId.value)
  ) {
    goToProjectList()
  }
})

watch(selectedProject, project => {
  if (currentPage.value === 'project-detail' && !project) {
    goToProjectList()
  }
})

watch(essayScopeOptions, options => {
  if (!options.some(option => option.id === selectedEssayScope.value)) {
    selectedEssayScope.value = 'all'
  }
})

watch(selectedEssayNote, note => {
  if (currentPage.value === 'essay-detail' && essayEditorMode.value !== 'create' && !note) {
    goToEssayList()
  }
})

watch(selectedSystemNote, note => {
  if (currentPage.value === 'system-detail' && !note) {
    goToSystemList()
  }
})

const getThemeLabel = themeId => {
  if (!themeId) return '未分类'
  return store.themes.find(theme => theme.id === themeId)?.name || '未分类'
}

const getProjectNames = ids => {
  if (!ids || ids.length === 0) return '未分类'
  return ids
    .map(id => store.projects.find(project => project.id === id)?.name || '未知项目')
    .join('、')
}

const essayProjectLabel = note => {
  if (!note?.projectIds?.length) return '未关联项目'
  return getProjectNames(note.projectIds)
}

const projectNoteCount = projectId =>
  store.notebook.filter(note => note.projectIds?.includes(projectId) && note.type !== 'system').length

const systemEventLabel = eventType => {
  if (eventType === 'project_merge') return '项目合并'
  if (eventType === 'project_delete') return '项目删除'
  return ''
}

const formatDuration = seconds => {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const notePreview = content => {
  if (!content) return '暂无内容'
  return content.length > 80 ? `${content.slice(0, 80)}...` : content
}

const noteTypeLabel = type => {
  if (type === 'essay') return '巡林随笔'
  return '植树记录'
}

const openSection = section => {
  cancelEditing()
  if (section === 'projects') {
    currentPage.value = 'project-list'
    selectedProjectId.value = null
    return
  }

  if (section === 'essays') {
    goToEssayList()
    return
  }

  currentPage.value = 'system-list'
  selectedSystemNoteId.value = null
}

const syncThemeWithProject = projectId => {
  const project = store.projects.find(item => item.id === projectId)
  if (!project) return

  if (!project.themeId) {
    selectedThemeId.value = UNCATEGORIZED_THEME_ID
    return
  }

  selectedThemeId.value = project.themeId
}

const openProject = projectId => {
  syncThemeWithProject(projectId)
  selectedProjectId.value = projectId
  currentPage.value = 'project-detail'
  cancelEditing()
}

const openSystemNote = noteId => {
  selectedSystemNoteId.value = noteId
  currentPage.value = 'system-detail'
}

const openEssay = noteId => {
  selectedEssayNoteId.value = noteId
  essayEditorMode.value = 'view'
  essayRenameDraft.value = ''
  currentPage.value = 'essay-detail'
}

function goToProjectList() {
  currentPage.value = 'project-list'
  selectedProjectId.value = null
  cancelEditing()
}

function goToEssayList() {
  currentPage.value = 'essay-list'
  selectedEssayNoteId.value = null
  essayEditorMode.value = 'view'
  essayRenameDraft.value = ''
  resetEssayDraft()
}

function goToSystemList() {
  currentPage.value = 'system-list'
  selectedSystemNoteId.value = null
}

function goBack() {
  if (currentPage.value === 'project-detail') {
    goToProjectList()
    return
  }

  if (currentPage.value === 'essay-detail') {
    goToEssayList()
    return
  }

  if (currentPage.value === 'system-detail') {
    goToSystemList()
    return
  }

  currentPage.value = 'home'
}

const themeTabClass = themeId => {
  if (selectedThemeId.value === themeId) {
    return store.isNightMode
      ? 'border-emerald-700 bg-emerald-900/20 text-white'
      : 'border-emerald-300 bg-emerald-50 text-gray-800'
  }

  return store.isNightMode
    ? 'border-white/10 bg-black/20 text-gray-300 hover:bg-black/30'
    : 'border-[#e5dfd1] bg-white/85 text-gray-700 hover:bg-white'
}

const essayScopeClass = scopeId => {
  if (selectedEssayScope.value === scopeId) {
    return store.isNightMode
      ? 'border-sky-700 bg-sky-900/20 text-white'
      : 'border-sky-300 bg-sky-50 text-gray-800'
  }

  return store.isNightMode
    ? 'border-white/10 bg-black/20 text-gray-300 hover:bg-black/30'
    : 'border-[#e5dfd1] bg-white/85 text-gray-700 hover:bg-white'
}

const systemListCardClass = computed(() =>
  store.isNightMode
    ? 'bg-[#17110a] border-amber-900/60 hover:border-amber-700'
    : 'bg-amber-50/80 border-amber-200 hover:border-amber-300'
)

const noteCardClass = note => {
  if (note.type === 'essay') {
    return store.isNightMode
      ? 'bg-[#151923] border-sky-900/40'
      : 'bg-sky-50/70 border-sky-200'
  }

  return store.isNightMode
    ? 'bg-[#141814] border-white/10 hover:border-emerald-800'
    : 'bg-white/85 border-[#e5dfd1] hover:border-emerald-200'
}

const noteBadgeClass = note => {
  if (note.type === 'essay') {
    return store.isNightMode
      ? 'text-sky-200 border-sky-700 bg-sky-900/30'
      : 'text-sky-700 border-sky-200 bg-sky-50'
  }

  return store.isNightMode
    ? 'text-green-300 border-green-900 bg-green-900/20'
    : 'text-green-700 border-green-200 bg-green-50'
}

const startEditing = note => {
  editingNoteId.value = note.id
  editDraft.title = note.title
  editDraft.content = note.content
  editDraft.projectId =
    note.projectIds?.[0] || selectedProject.value?.id || editableProjectOptions.value[0]?.id || 'all'
}

function cancelEditing() {
  editingNoteId.value = null
  editDraft.title = ''
  editDraft.content = ''
  editDraft.projectId = 'all'
}

function resetEssayDraft() {
  essayDraft.title = ''
  essayDraft.content = ''
  essayDraft.projectId = 'all'
}

const fillEssayDraft = note => {
  essayDraft.title = note?.title || ''
  essayDraft.content = note?.content || ''
  essayDraft.projectId = note?.projectIds?.[0] || 'all'
}

const startEssayCreate = () => {
  selectedEssayNoteId.value = null
  essayEditorMode.value = 'create'
  essayRenameDraft.value = ''
  resetEssayDraft()
  currentPage.value = 'essay-detail'
}

const startEssayCreateWithProject = projectId => {
  startEssayCreate()
  essayDraft.projectId = projectId || 'all'
}

const startEssayEdit = () => {
  if (!selectedEssayNote.value) return
  essayEditorMode.value = 'edit'
  fillEssayDraft(selectedEssayNote.value)
}

const cancelEssayEditor = () => {
  if (essayEditorMode.value === 'create') {
    goToEssayList()
    return
  }

  essayEditorMode.value = 'view'
  resetEssayDraft()
}

const startEssayRename = () => {
  if (!selectedEssayNote.value) return
  essayRenameDraft.value = selectedEssayNote.value.title
  essayEditorMode.value = 'rename'
}

const cancelEssayRename = () => {
  essayRenameDraft.value = ''
  essayEditorMode.value = 'view'
}

const saveEssayRename = () => {
  if (!selectedEssayNote.value) return
  const title = essayRenameDraft.value.trim()
  if (!title) return
  store.renameNote(selectedEssayNote.value.id, title)
  essayRenameDraft.value = ''
  essayEditorMode.value = 'view'
}

const saveEssayDraft = async () => {
  const title = essayDraft.title.trim()
  const content = essayDraft.content
  const projectIds = essayDraft.projectId === 'all' ? [] : [essayDraft.projectId]

  if (!title) {
    await alertDialog('请填写随笔标题', {
      title: '缺少标题'
    })
    return
  }

  if (essayEditorMode.value === 'create') {
    const created = store.createEssayNote(title, content, projectIds)
    if (!created) return
    selectedEssayNoteId.value = created.id
    essayEditorMode.value = 'view'
    resetEssayDraft()
    return
  }

  if (!selectedEssayNote.value) return
  const updated = store.updateNote(selectedEssayNote.value.id, {
    title,
    content,
    projectIds
  })
  if (!updated) return
  essayEditorMode.value = 'view'
  resetEssayDraft()
}

const deleteEssay = async noteId => {
  const note = essayNotes.value.find(item => item.id === noteId)
  if (!note) return
  const confirmed = await confirmDialog(`确定要删除随笔 "${note.title}" 吗？`, {
    title: '删除随笔',
    confirmText: '删除'
  })
  if (!confirmed) return
  store.deleteNote(noteId)
  goToEssayList()
}

const saveEditing = noteId => {
  const updated = store.updateNote(noteId, {
    title: editDraft.title,
    content: editDraft.content,
    projectIds: editDraft.projectId === 'all' ? [] : [editDraft.projectId]
  })

  if (!updated) return

  if (editDraft.projectId !== 'all') {
    syncThemeWithProject(editDraft.projectId)
    selectedProjectId.value = editDraft.projectId
  }

  cancelEditing()
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
