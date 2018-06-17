// @flow
import { duration } from 'moment'
import R from 'ramda'
import { reducePeriodFromStart, deleteOverlap } from './periods'
import maxChunkInOpening from './maxChunkInOpening'
import type { Goal } from './goals'
import type { Opening } from './openings'
import type { Period } from './periods'

export type ActivityChunk = Period

export type SingleGoalSchedule = {|
  activityChunks: Array<ActivityChunk>,
  openings: Array<Opening>,
|}

export type Schedule = Array<SingleGoalSchedule>

type SingleGoalScheduleResult = {
  schedule: SingleGoalSchedule,
  activitySum: moment$MomentDuration,
  potentialExtraActivityChunks: ActivityChunk[],
  potentialExtraActivitySum: moment$MomentDuration,
}

// distributes activity blocks in free time for a given cycle
// seems maybe it makes sense to loop twice, in order to find a) possible schedule
// and b) maxed-out 'schedule' for feasibility rating
export const makeSingleGoalSchedule = (
  goal: Goal,
  openings: Opening[],
): SingleGoalScheduleResult => {
  const { chunking, volume, interval } = goal

  return openings.reduce((accumulator, opening) => {
    const { activitySum, schedule } = accumulator
    const goalVolumeMet = activitySum.asMilliseconds() >= volume.asMilliseconds()
    const activityChunksDestination = goalVolumeMet
      ? accumulator.potentialExtraActivityChunks
      : schedule.activityChunks

    const lastChunkInResult = R.last(schedule.activityChunks)
    const nextChunkMinStart = lastChunkInResult && interval.min
      ? lastChunkInResult.end.add(interval.min)
      : null
    const openingMinusRestingTime = nextChunkMinStart
      ? {
        start: nextChunkMinStart.isAfter(opening.start) ? nextChunkMinStart : opening.start,
        end: opening.end,
      }
      : opening
    const openingIsValid = opening.start.isBefore(opening.end)
    const maxActivityChunkDuration = openingIsValid
      && maxChunkInOpening(chunking, openingMinusRestingTime)
    if (maxActivityChunkDuration) {
      activityChunksDestination.push({
        start: opening.start,
        end: opening.start.clone().add(maxActivityChunkDuration),
      })
      const activitySumDestination = goalVolumeMet
        ? accumulator.potentialExtraActivitySum
        : activitySum
      activitySumDestination.add(maxActivityChunkDuration)
    }
    const newOpening = !goalVolumeMet && maxActivityChunkDuration
      ? reducePeriodFromStart(maxActivityChunkDuration, opening)
      : opening

    if (newOpening) {
      schedule.openings.push(newOpening)
    }

    return accumulator
  }, {
    activitySum: duration(0),
    schedule: {
      activityChunks: [],
      openings: [],
    },
    potentialExtraActivityChunks: [],
    potentialExtraActivitySum: duration(0),
  })
}

const descendingByMaxChunk = ({ chunking: { max: a } }, { chunking: { max: b } }) => {
  if (a.asMilliseconds() > b.asMilliseconds()) return -1
  if (a.asMilliseconds() < b.asMilliseconds()) return 1
  return 0
}

export default function makeSchedule(goals: Array<Goal>): { [string]: SingleGoalSchedule } {
  const withIntermediaryOpenings = goals
    .sort(descendingByMaxChunk)
    .reduce((accumulator, goal) => {
      const { activityChunks } = accumulator
      const openingsAfterPriorActivity = deleteOverlap(goal.openings, activityChunks)
      const { schedule, activitySum, potentialExtraActivitySum } = makeSingleGoalSchedule(goal, openingsAfterPriorActivity)
      console.log(JSON.stringify(potentialExtraActivitySum))
      if (activitySum.asMilliseconds() < goal.volume.asMilliseconds()) {
        throw new Error(`Not enough time for goal "${goal.name}"`)
      }

      const { activityChunks: newActivityChunks } = schedule

      accumulator.schedule[goal.id] = schedule // eslint-disable-line no-param-reassign
      newActivityChunks.forEach(ac => activityChunks.push(ac))

      return accumulator
    }, {
      activityChunks: [],
      schedule: {},
    })


  const schedule = R.map((singleGoalSchedule) => {
    singleGoalSchedule.openings = // eslint-disable-line no-param-reassign
      deleteOverlap(singleGoalSchedule.openings, withIntermediaryOpenings.activityChunks)
    return singleGoalSchedule
  }, withIntermediaryOpenings.schedule)

  return schedule
}
