<template>
  <section class="cloud-account-panel" :class="{ 'cloud-account-panel--wide': wide }">
    <header class="cloud-account-panel__header">
      <div>
        <div class="paper-label">邀请制云端账号</div>
        <strong :title="accountEmail">{{ accountEmail }}</strong>
      </div>
      <span class="cloud-account-panel__environment">{{ environmentLabel }}</span>
    </header>

    <dl class="cloud-account-panel__details">
      <div>
        <dt>同步状态</dt>
        <dd>{{ syncLabel }}</dd>
      </div>
      <div>
        <dt>最近同步</dt>
        <dd>{{ lastSyncedLabel }}</dd>
      </div>
      <div>
        <dt>云端修订</dt>
        <dd>{{ store.persistenceRevision || 0 }}</dd>
      </div>
    </dl>

    <footer class="cloud-account-panel__footer">
      <p>账号由管理员邀请并通过邮箱验证码登录；身份数据只写入当前账号。</p>
      <button v-if="canLogout" class="quiet-button" type="button" @click="handleLogout">
        退出登录
      </button>
    </footer>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, reactive } from 'vue'
import { confirmDialog } from '@/composables/dialogService'
import { useSaveStore } from '@/stores/saveStore'

defineProps({
  wide: { type: Boolean, default: false },
})

const saveStore = useSaveStore()
const store = reactive({
  ...storeToRefs(saveStore),
  flushPersistence: saveStore.flushPersistence,
})

const accountEmail = computed(() => store.persistenceUser?.email || '正在确认登录账号')
const canLogout = computed(() => store.persistenceUser?.source === 'cloudflare-access')
const environmentLabel = computed(() => {
  const labels = {
    production: '正式环境',
    preview: '临时正式环境',
    development: 'Development',
    local: 'Local',
  }
  return labels[store.persistenceEnvironment] || store.persistenceEnvironment || 'Cloud'
})
const syncLabel = computed(() => {
  const labels = {
    initializing: '连接中',
    pending: '等待同步',
    saving: '同步中',
    ready: '已同步',
    offline: '离线未同步',
    conflict: '版本冲突',
    degraded: '同步异常',
    fatal: '云端不可用',
  }
  return labels[store.persistenceState] || '同步异常'
})
const lastSyncedLabel = computed(() => {
  if (!store.persistenceUpdatedAt) return '尚未写入'
  const value = new Date(store.persistenceUpdatedAt)
  if (Number.isNaN(value.getTime())) return '时间未知'
  return value.toLocaleString('zh-CN', { hour12: false })
})

const handleLogout = async () => {
  const flushed = await store.flushPersistence({ reloadOnFailure: false })
  if (!flushed) {
    const continueLogout = await confirmDialog(
      '当前页面仍有未同步数据。现在退出可能丢失这些修改，是否仍要退出？',
      { title: '云端尚未同步', confirmText: '仍要退出' },
    )
    if (!continueLogout) return
  }
  window.location.assign('/cdn-cgi/access/logout')
}
</script>

<style scoped>
.cloud-account-panel {
  display: grid;
  gap: 13px;
  margin-top: 14px;
  padding: 13px;
  border: 1px solid var(--line-soft);
  border-radius: 8px 8px 8px 3px;
  background: color-mix(in srgb, var(--paper-base) 74%, transparent);
}

.cloud-account-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.cloud-account-panel__header strong {
  display: block;
  max-width: 205px;
  margin-top: 4px;
  overflow: hidden;
  color: var(--ink-strong);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-account-panel__environment {
  flex: none;
  padding: 3px 6px;
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  color: var(--forest-700);
  background: var(--sage-wash);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.cloud-account-panel__details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.cloud-account-panel__details div {
  min-width: 0;
}

.cloud-account-panel__details dt {
  color: var(--ink-soft);
  font-size: 10px;
}

.cloud-account-panel__details dd {
  margin: 3px 0 0;
  overflow: hidden;
  color: var(--ink-strong);
  font-size: 11px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-account-panel__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--line-soft);
}

.cloud-account-panel__footer p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 10px;
  line-height: 1.55;
}

.cloud-account-panel__footer .quiet-button {
  flex: none;
  min-height: 30px;
  padding: 5px 9px;
  font-size: 11px;
}

.cloud-account-panel--wide {
  grid-template-columns: minmax(220px, 1.1fr) minmax(260px, 1fr) minmax(280px, 1.2fr);
  align-items: center;
  margin: 24px 0 0;
  padding: 14px 16px;
}

.cloud-account-panel--wide .cloud-account-panel__header,
.cloud-account-panel--wide .cloud-account-panel__footer {
  min-width: 0;
}

.cloud-account-panel--wide .cloud-account-panel__footer {
  padding-top: 0;
  padding-left: 14px;
  border-top: 0;
  border-left: 1px solid var(--line-soft);
}

@container (max-width: 780px) {
  .cloud-account-panel--wide {
    grid-template-columns: 1fr;
  }

  .cloud-account-panel--wide .cloud-account-panel__footer {
    padding-top: 10px;
    padding-left: 0;
    border-top: 1px solid var(--line-soft);
    border-left: 0;
  }
}
</style>
