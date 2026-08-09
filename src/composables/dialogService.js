import { reactive } from 'vue'

const dialogQueue = []

export const dialogState = reactive({
  active: null
})

function showNextDialog() {
  dialogState.active = dialogQueue.shift() || null
}

function enqueueDialog(config) {
  return new Promise(resolve => {
    dialogQueue.push({
      title: '提示',
      message: '',
      confirmText: '确定',
      cancelText: '取消',
      defaultValue: '',
      placeholder: '',
      ...config,
      resolve
    })

    if (!dialogState.active) showNextDialog()
  })
}

export function resolveDialog(result) {
  const activeDialog = dialogState.active
  if (!activeDialog) return

  dialogState.active = null
  activeDialog.resolve(result)
  showNextDialog()
}

export function dismissActiveDialog() {
  const activeDialog = dialogState.active
  if (!activeDialog) return

  if (activeDialog.type === 'confirm') {
    resolveDialog(false)
    return
  }

  if (activeDialog.type === 'prompt') {
    resolveDialog(null)
    return
  }

  if (activeDialog.type === 'choice') {
    resolveDialog(null)
    return
  }

  resolveDialog(true)
}

export function alertDialog(message, options = {}) {
  return enqueueDialog({
    type: 'alert',
    title: options.title || '提示',
    message,
    confirmText: options.confirmText || '知道了'
  })
}

export function confirmDialog(message, options = {}) {
  return enqueueDialog({
    type: 'confirm',
    title: options.title || '请确认',
    message,
    confirmText: options.confirmText || '确认',
    cancelText: options.cancelText || '取消'
  })
}

export function promptDialog(message, options = {}) {
  return enqueueDialog({
    type: 'prompt',
    title: options.title || '输入内容',
    message,
    confirmText: options.confirmText || '确认',
    cancelText: options.cancelText || '取消',
    defaultValue: options.defaultValue || '',
    placeholder: options.placeholder || ''
  })
}

export function choiceDialog(message, options = {}) {
  return enqueueDialog({
    type: 'choice',
    title: options.title || '请选择',
    message,
    cancelText: options.cancelText || '取消',
    choices: options.choices || [],
  })
}
