export function getRunningTimerDelta({
  isRunning,
  hasActiveTree,
  timer,
  lastTimestamp,
  now,
  maxTime
}) {
  if (!isRunning || !hasActiveTree) {
    return {
      actualDelta: 0,
      nextTimestamp: now,
      nextTimer: timer
    }
  }

  const delta = Math.max(0, (now - lastTimestamp) / 1000)
  if (timer >= maxTime) {
    return {
      actualDelta: 0,
      nextTimestamp: now,
      nextTimer: timer
    }
  }

  const actualDelta = Math.min(delta, maxTime - timer)
  return {
    actualDelta,
    nextTimestamp: now,
    nextTimer: timer + actualDelta
  }
}
