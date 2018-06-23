// @flow
import { duration } from 'moment'
import R from 'ramda'
import { reducePeriodFromStart, deleteOverlap } from './periods'
import maxChunksInOpening from './maxChunksInOpening'
import type { Goal } from './goals'
import type { Opening } from './openings'
import type { Period } from './periods'
import type { Schedule } from './schedules'

type SingleGoalScheduleResult = {
  schedule: Schedule,
  activitySum: moment$MomentDuration,
  potentialExtraActivityChunks: Period[],
  potentialExtraActivitySum: moment$MomentDuration,
}

const getOpeningMinusRestingTime = (
  schedule: Schedule,
  goal: Goal,
  opening: Opening,
): ?Opening => {
  const minimumInterval = goal.interval.min
  const lastChunkInResult = R.last(schedule.activityChunks)
  const nextChunkEarliestStart = minimumInterval && lastChunkInResult
    ? lastChunkInResult.end.clone().add(minimumInterval)
    : null
  const openingMinusRestingTime = nextChunkEarliestStart
    ? {
      start: nextChunkEarliestStart.isAfter(opening.start) ? nextChunkEarliestStart : opening.start,
      end: opening.end,
    }
    : opening
  const openingIsValid = openingMinusRestingTime.start.isBefore(opening.end)
  return openingIsValid ? openingMinusRestingTime : null
}

// distributes activity blocks in free time for a given cycle
// seems maybe it makes sense to loop twice, in order to find a) possible schedule
// and b) maxed-out 'schedule' for feasibility rating
export const makeSingleGoalSchedule = (
  goal: Goal,
  openings: Opening[],
): SingleGoalScheduleResult => {
  const { volume } = goal

  return openings.reduce((accumulator, opening) => {
    const { activitySum, schedule } = accumulator
    const goalVolumeMet = activitySum.asMilliseconds() >= volume.asMilliseconds()
    const activityChunksDestination = goalVolumeMet
      ? accumulator.potentialExtraActivityChunks
      : schedule.activityChunks

    const openingMinusRestingTime = getOpeningMinusRestingTime(schedule, goal, opening)
    const maxActivityChunksDurations = openingMinusRestingTime
      ? maxChunksInOpening(goal, openingMinusRestingTime)
      : []

    maxActivityChunksDurations.forEach((chunkDuration) => {
      const newActivityChunk = {
        start: opening.start,
        end: opening.start.clone().add(chunkDuration),
      }
      activityChunksDestination.push(newActivityChunk)

      const activitySumDestination = goalVolumeMet
        ? accumulator.potentialExtraActivitySum
        : activitySum
      activitySumDestination.add(chunkDuration)
      const newOpening = goalVolumeMet ? opening : reducePeriodFromStart(chunkDuration, opening)
      if (newOpening) {
        schedule.openings.push(newOpening)
      }
    })
    if (!maxActivityChunksDurations.length) {
      schedule.openings.push(opening)
    }

    return accumulator
  }, {
    activitySum: duration(0),
    schedule: {
      activityChunks: [],
      openings: [],
      potentialExtraActivityChunks: [],
      potentialExtraActivitySum: duration(0),
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

export default function makeSchedule(goals: Array<Goal>): { [string]: Schedule } {
  const withIntermediaryOpenings = goals
    .sort(descendingByMaxChunk)
    .reduce((accumulator, goal) => {
      const { activityChunks } = accumulator
      const openingsAfterPriorActivity = deleteOverlap(goal.openings, activityChunks)
      const { schedule } =
        makeSingleGoalSchedule(goal, openingsAfterPriorActivity)

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
