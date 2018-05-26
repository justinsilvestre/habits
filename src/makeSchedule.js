// @flow
import { duration } from 'moment'
import { map } from 'ramda'
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

// distributes activity blocks in free time for a given cycle
// seems maybe it makes sense to loop twice, in order to find a) possible schedule
// and b) maxed-out 'schedule' for feasibility rating
export const makeSingleGoalSchedule = (
  goal: Goal,
  openings: Opening[],
): { schedule: SingleGoalSchedule, activitySum: moment$MomentDuration } => {
  const { chunking, volume } = goal

  return openings.reduce((accumulator, opening) => {
    const { activitySum, schedule } = accumulator
    const goalVolumeMet = activitySum.asMilliseconds() >= volume.asMilliseconds()
    const activityChunksDestination = goalVolumeMet
      ? accumulator.potentialExtraActivityChunks
      : schedule.activityChunks

    const maxActivityChunkDuration = maxChunkInOpening(chunking, opening)
    if (maxActivityChunkDuration) {
      activityChunksDestination.push({
        start: opening.start,
        end: opening.start.clone().add(maxActivityChunkDuration),
      })
    }
    if (maxActivityChunkDuration) {
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
      const { schedule, activitySum } = makeSingleGoalSchedule(goal, openingsAfterPriorActivity)

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


  const schedule = map((singleGoalSchedule) => {
    singleGoalSchedule.openings = // eslint-disable-line no-param-reassign
      deleteOverlap(singleGoalSchedule.openings, withIntermediaryOpenings.activityChunks)
    return singleGoalSchedule
  }, withIntermediaryOpenings.schedule)

  return schedule
}
