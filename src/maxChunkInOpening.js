// @flow
import { duration } from 'moment'
import { getDuration as getPeriodDuration } from './periods'
import type { Opening } from './openings'
import type { GoalChunking } from './goals'

const maxChunkInOpening = (chunking: GoalChunking, opening: Opening): ?moment$MomentDuration => {
  const openingDurationMinutes = getPeriodDuration(opening).asMinutes()

  if (!openingDurationMinutes || openingDurationMinutes < chunking.min.asMinutes()) return null

  const maxFittingChunkMinutes = Math.min(chunking.max.asMinutes(), openingDurationMinutes)
  return duration(maxFittingChunkMinutes, 'minutes')
}

export default maxChunkInOpening
