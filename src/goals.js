// @flow

import moment, { duration } from 'moment'
import { minBy } from 'ramda'
import { getVolume } from './openings'
import type { Opening } from './openings'
import type { Period } from './period'

const readTwoBooks : Goal = {
  name: 'Read two books',
  startDate: moment('2018-03-22'),
  endDate: moment('2018-06-22'),
  volume: duration(20, 'hours'),
  chunking: {
    min: duration(30, 'minutes'),
    max: duration(60, 'minutes'),
  }
,
  interval: {
    min: duration(90, 'minutes'),
  },
  priority: 1,
}

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

export function makeSchedule(goalsAndOpenings) {
  return
}

type ActivityChunk = Period

type Schedule = {
  activityChunks: Array<ActivityChunk>,
  openings: Array<Opening>,
}

// distributes activity blocks in free time for a given cycle
const makeSingleGoalSchedule = (goal: Goal, openings: Array<Opening>): Schedule => {

  return {
    activityChunks: [],
    openings: [],
  }
}

//
const DEFAULT_WIGGLE_FACTOR = 2

const getOpeningDuration = ({ start, end }) => duration(end.diff(start))
const getMinDuration = minBy((duration) => duration.asMilliseconds())

const maxChunksInOpening = (goal: Goal, opening: Opening): Array<moment$MomentDuration> => {
  const openingDurationMinutes = getOpeningDuration(opening).asMinutes()
  const { chunking } = goal

  if (!openingDurationMinutes || openingDurationMinutes < chunking.min.asMinutes()) return []

  const maxFittingChunkMinutes = Math.min(chunking.max.asMinutes(), openingDurationMinutes)
  const maxFittingChunk = duration(maxFittingChunkMinutes, 'minutes')
  const minimumInterval = goal.interval.min
  const nextOpeningOffset: moment$MomentDuration = minimumInterval
    ? maxFittingChunk.clone().add(minimumInterval)
    : maxFittingChunk

  return [maxFittingChunk, ...maxChunksInOpening(goal, {
    start: opening.start.add(nextOpeningOffset),
    end: opening.end,
  })]
}

const getMaxMinutesWithinOpenings = (goal: Goal, openings: Array<Opening>): number => {
  const maxChunkMinutes = goal.chunking.max.asMinutes()

  return openings.reduce((total, opening) => {
    const maxMinutesWithinOpening = maxChunksInOpening(goal, opening)
      .reduce((total2, duration) => total2 + duration.asMinutes(), 0)

    return total + maxMinutesWithinOpening
  }, 0)
}

const getSingleGoalFeasability = (goal: Goal, openings: Array<Opening>, wiggleFactor: number): number => {
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
  return goalsAndOpenings.map(({ goal, openings }) => {
    return getSingleGoalFeasability(goal, openings, wiggleFactor)
  }).reduce((a,b) => a+b, 0) / goalsAndOpenings.length
  return goalsAndOpenings.reduce((scheduleSoFar, { goal, openings }) => {
    return getSingleGoalFeasability(goal, fillOpenings(openings, scheduleSoFar), wiggleFactor)
  }, {})
}
