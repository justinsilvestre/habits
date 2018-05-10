// @flow
import { duration } from 'moment'
import type { Opening } from './openings'
import type { Period } from './period'

type GoalChunking = {
  min: moment$MomentDuration,
  max: moment$MomentDuration,
}

export type Goal = {|
  name: string,
  startDate: moment$Moment,
  endDate: moment$Moment,
  volume: moment$MomentDuration,
  chunking: GoalChunking,
  interval: {
    min?: moment$MomentDuration,
    max?: moment$MomentDuration,
  },
  priority: number,
|}

const DEFAULT_WIGGLE_FACTOR = 2

const getPeriodDuration = ({ start, end }) => duration(end.diff(start))

const maxChunkInOpening = (goal: Goal, opening: Opening): ?moment$MomentDuration => {
  const openingDurationMinutes = getPeriodDuration(opening).asMinutes()
  const { chunking } = goal

  if (!openingDurationMinutes || openingDurationMinutes < chunking.min.asMinutes()) return null

  const maxFittingChunkMinutes = Math.min(chunking.max.asMinutes(), openingDurationMinutes)
  return duration(maxFittingChunkMinutes, 'minutes')
}

type ActivityChunk = Period

type Schedule = {
  activityChunks: Array<ActivityChunk>,
  openings: Array<Opening>,
}

const reduceOpeningFromStart = (activityChunk: moment$MomentDuration, opening: Opening): ?Opening => {
  const { start, end } = opening
  const newStart = start.clone().add(activityChunk)
  return newStart.valueOf() >= end.valueOf()
    ? null
    : { start: newStart, end }
}

// distributes activity blocks in free time for a given cycle
// but how to make
const makeSingleGoalSchedule = (goal: Goal, openings: Array<Opening>): Schedule => {
  const result = openings.reduce(({ activitySum, schedule }, opening) => {
    if (activitySum.asMinutes() >= goal.volume.asMinutes()) {
      return { activitySum, schedule }
    }

    const { activityChunks, openings: newOpenings } = schedule
    const maxActivityChunkDuration = maxChunkInOpening(goal, opening)
    if (maxActivityChunkDuration) {
      activityChunks.push({
        start: opening.start,
        end: opening.end.clone().add(maxActivityChunkDuration),
      })
      activitySum.add(maxActivityChunkDuration)
    }
    const newOpening = maxActivityChunkDuration
      ? reduceOpeningFromStart(maxActivityChunkDuration, opening)
      : opening
    if (newOpening) {
      newOpenings.push(newOpening)
    }

    return { activitySum, schedule }
  }, {
    activitySum: duration(0),
    schedule: {
      activityChunks: [],
      openings: [],
    },
  })
  return result.schedule
}

export function makeSchedule(goalsAndOpenings: Array<{ goal: Goal, opening: Opening }>) {

}

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

const getSingleGoalFeasability = (
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

const fillOpenings = (openings, scheduleSoFar) => ({})

export function getFeasibility(goalsAndOpenings: Array<{ goal: Goal, openings: Array<Opening> }>, wiggleFactor: number = DEFAULT_WIGGLE_FACTOR): number {
  const [a] = goalsAndOpenings
  const { goal, openings } = a

  // return getSingleGoalFeasability(goal, openings, wiggleFactor)
  return goalsAndOpenings
    .map(({ goal, openings }) => getSingleGoalFeasability(goal, openings, wiggleFactor))
    .reduce((a, b) => a + b, 0) / goalsAndOpenings.length
  // return goalsAndOpenings.reduce((scheduleSoFar, { goal, openings }) => getSingleGoalFeasability(goal, fillOpenings(openings, scheduleSoFar), wiggleFactor), {})
}
