// @flow
import maxChunkInOpening from './maxChunkInOpening'
import type { Goal } from './goals'
import type { Opening } from './openings'

const DEFAULT_WIGGLE_FACTOR = 2

const maxChunksInOpening = (goal: Goal, opening: Opening): Array<moment$MomentDuration> => {
  const maxFittingChunk = maxChunkInOpening(goal, opening)
  if (!maxFittingChunk) return []
  //
  const minimumInterval = goal.interval.min
  const nextOpeningOffset: moment$MomentDuration = minimumInterval
    ? maxFittingChunk.clone().add(minimumInterval)
    : maxFittingChunk

  return [maxFittingChunk, ...maxChunksInOpening(goal, {
    start: opening.start.clone().add(nextOpeningOffset),
    end: opening.end,
  })]
}

const getMaxMinutesWithinOpenings = (goal: Goal, openings: Array<Opening>): number =>
  openings.reduce((total, opening) => {
    const maxMinutesWithinOpening = maxChunksInOpening(goal, opening)
      .reduce((total2, dur) => total2 + dur.asMinutes(), 0)

    return total + maxMinutesWithinOpening
  }, 0)

const getSingleGoalFeasibility = (
  goal: Goal,
  openings: Array<Opening>,
  wiggleFactor: number,
): number => {
  const goalVolume = goal.volume.asMinutes()
  const maxMinutesWithinOpenings = getMaxMinutesWithinOpenings(goal, openings)
  const availabilityRatio = maxMinutesWithinOpenings / goalVolume / wiggleFactor

  if (maxMinutesWithinOpenings < goalVolume) return 0

  return availabilityRatio
}


export default function getFeasibility(
  goalsAndOpenings: Array<{ goal: Goal, openings: Array<Opening> }>,
  wiggleFactor: number = DEFAULT_WIGGLE_FACTOR,
): number {
  const [a] = goalsAndOpenings
  const { goal, openings } = a

  // return getSingleGoalFeasibility(goal, openings, wiggleFactor)
  return goalsAndOpenings
    .map(({ goal, openings }) => getSingleGoalFeasibility(goal, openings, wiggleFactor))
    .reduce((a, b) => a + b, 0) / goalsAndOpenings.length
  // return goalsAndOpenings.reduce((scheduleSoFar, { goal, openings }) =>
  //   getSingleGoalFeasibility(goal, fillOpenings(openings, scheduleSoFar), wiggleFactor), {})
}
