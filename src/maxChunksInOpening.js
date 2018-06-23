// @flow
import { duration } from 'moment'
import { getDuration as getPeriodDuration, reducePeriodFromStart } from './periods'
import type { Opening } from './openings'
import type { Goal } from './goals'

const maxChunksInOpening = (goal: Goal, opening: Opening): Array<moment$MomentDuration> => {
  const openingDurationMinutes = getPeriodDuration(opening).asMinutes()
  const { chunking } = goal

  if (!openingDurationMinutes || openingDurationMinutes < chunking.min.asMinutes()) return []

  const maxFittingChunkMinutes = Math.min(chunking.max.asMinutes(), openingDurationMinutes)
  const offset = duration(maxFittingChunkMinutes, 'minutes').add(goal.interval.min || duration(0))
  const reducedOpening = reducePeriodFromStart(offset, opening)
  const newChunks = maxFittingChunkMinutes ? [duration(maxFittingChunkMinutes, 'minutes')] : []

  return reducedOpening
    ? newChunks.concat(maxChunksInOpening(goal, reducedOpening))
    : newChunks
}

export default maxChunksInOpening
