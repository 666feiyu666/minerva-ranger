export const PLANTING_MODES = Object.freeze({
  COUNTUP: 'countup',
  COUNTDOWN: 'countdown'
})

export const DEFAULT_COUNTUP_DURATION = 3 * 60 * 60
export const MAX_CONFIGURABLE_DURATION = 24 * 60 * 60

export function getPlantingModeLabel(mode) {
  return mode === PLANTING_MODES.COUNTDOWN ? '倒计时' : '正计时'
}

export function validatePlantingMode({ mode, targetDuration, cycleDuration }) {
  if (!Object.values(PLANTING_MODES).includes(mode)) {
    return { ok: false, error: '请选择有效的计时模式。' }
  }

  const usesDefaultDuration =
    mode === PLANTING_MODES.COUNTUP &&
    (targetDuration === '' || targetDuration === null || targetDuration === undefined)

  if (
    mode === PLANTING_MODES.COUNTDOWN &&
    (targetDuration === '' || targetDuration === null || targetDuration === undefined)
  ) {
    return { ok: false, error: '请设置本次倒计时的种植时间。' }
  }

  const normalizedTargetDuration = usesDefaultDuration
    ? DEFAULT_COUNTUP_DURATION
    : Math.floor(Number(targetDuration))

  if (!Number.isFinite(normalizedTargetDuration) || normalizedTargetDuration <= 0) {
    return { ok: false, error: '请输入有效的种植时间。' }
  }

  if (normalizedTargetDuration < cycleDuration) {
    return { ok: false, error: '种植时间不能低于该树木的单周期时间。' }
  }

  if (normalizedTargetDuration > MAX_CONFIGURABLE_DURATION) {
    return { ok: false, error: '单次种植时间不能超过24小时。' }
  }

  return {
    ok: true,
    mode,
    targetDuration: normalizedTargetDuration,
    usesDefaultDuration,
    error: null
  }
}

export function getTaskTimeState({ mode, elapsedDuration, targetDuration }) {
  const elapsed = Math.max(0, elapsedDuration || 0)
  const target = Math.max(0, targetDuration || 0)

  return {
    elapsed,
    remaining: Math.max(0, target - elapsed),
    reachedLimit: target > 0 && elapsed >= target,
    primaryTime: mode === PLANTING_MODES.COUNTDOWN ? Math.max(0, target - elapsed) : elapsed
  }
}
