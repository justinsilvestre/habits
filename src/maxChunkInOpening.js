// @flow
import { duration } from 'moment'
import { getDuration as getPeriodDuration } from './period'
import type { Opening } from './openings'
import type { Goal } from './goals'

const maxChunkInOpening = (goal: Goal, opening: Opening): ?moment$MomentDuration => {
  const openingDurationMinutes = getPeriodDuration(opening).asMinutes()
  const { chunking } = goal

  if (!openingDurationMinutes || openingDurationMinutes < chunking.min.asMinutes()) return null

  const maxFittingChunkMinutes = Math.min(chunking.max.asMinutes(), openingDurationMinutes)
  return duration(maxFittingChunkMinutes, 'minutes')
}

export default maxChunkInOpening
