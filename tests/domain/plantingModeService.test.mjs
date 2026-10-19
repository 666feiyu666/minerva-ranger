import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_COUNTUP_DURATION,
  MAX_CONFIGURABLE_DURATION,
  PLANTING_MODES,
  getTaskTimeState,
  validatePlantingMode
} from '../src/local-backend/services/plantingModeService.mjs'

const CYCLE_DURATION = 25 * 60

test('正计时未设置目标时长时默认使用3小时', () => {
  const result = validatePlantingMode({
    mode: PLANTING_MODES.COUNTUP,
    targetDuration: '',
    cycleDuration: CYCLE_DURATION
  })

  assert.equal(result.ok, true)
  assert.equal(result.targetDuration, DEFAULT_COUNTUP_DURATION)
  assert.equal(result.usesDefaultDuration, true)
})

test('正计时允许玩家设置一个周期至24小时的目标时长', () => {
  const minimum = validatePlantingMode({
    mode: PLANTING_MODES.COUNTUP,
    targetDuration: CYCLE_DURATION,
    cycleDuration: CYCLE_DURATION
  })
  const maximum = validatePlantingMode({
    mode: PLANTING_MODES.COUNTUP,
    targetDuration: MAX_CONFIGURABLE_DURATION,
    cycleDuration: CYCLE_DURATION
  })

  assert.equal(minimum.ok, true)
  assert.equal(maximum.ok, true)
})

test('倒计时必须设置目标时长', () => {
  const result = validatePlantingMode({
    mode: PLANTING_MODES.COUNTDOWN,
    targetDuration: '',
    cycleDuration: CYCLE_DURATION
  })

  assert.equal(result.ok, false)
  assert.equal(result.error, '请设置本次倒计时的种植时间。')
})

test('设置时长不能低于一个完整周期', () => {
  const result = validatePlantingMode({
    mode: PLANTING_MODES.COUNTDOWN,
    targetDuration: CYCLE_DURATION - 1,
    cycleDuration: CYCLE_DURATION
  })

  assert.equal(result.ok, false)
  assert.equal(result.error, '种植时间不能低于该树木的单周期时间。')
})

test('设置时长不能超过24小时', () => {
  const result = validatePlantingMode({
    mode: PLANTING_MODES.COUNTUP,
    targetDuration: MAX_CONFIGURABLE_DURATION + 1,
    cycleDuration: CYCLE_DURATION
  })

  assert.equal(result.ok, false)
  assert.equal(result.error, '单次种植时间不能超过24小时。')
})

test('设置时长不需要是单周期时间的整数倍', () => {
  const result = validatePlantingMode({
    mode: PLANTING_MODES.COUNTDOWN,
    targetDuration: 37 * 60,
    cycleDuration: CYCLE_DURATION
  })

  assert.equal(result.ok, true)
  assert.equal(result.targetDuration, 37 * 60)
})

test('倒计时显示剩余时间，正计时显示已用时间', () => {
  const countdown = getTaskTimeState({
    mode: PLANTING_MODES.COUNTDOWN,
    elapsedDuration: 20 * 60,
    targetDuration: 60 * 60
  })
  const countup = getTaskTimeState({
    mode: PLANTING_MODES.COUNTUP,
    elapsedDuration: 20 * 60,
    targetDuration: 60 * 60
  })

  assert.equal(countdown.primaryTime, 40 * 60)
  assert.equal(countup.primaryTime, 20 * 60)
  assert.equal(countdown.reachedLimit, false)
})
