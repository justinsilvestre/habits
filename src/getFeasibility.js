// @flow
import { duration } from 'moment'
import makeSchedule from './makeSchedule'
import type { Goal } from './goals'
import type { Opening } from './openings'
import type { Schedule } from './schedules'

const DEFAULT_WIGGLE_FACTOR = 2

const sumVolume = (periods: Array<Opening>): moment$MomentDuration =>
  periods.reduce((sum, { start, end }) => sum.add(end.clone().diff(start)), duration(0))

const scheduledGoalsArray = (objs: { [string]: Schedule }): Array<Schedule> =>
  Object.keys(objs).map(key => objs[key])

export default function getFeasibility(
  goals: Array<Goal>,
  wiggleFactor: number = DEFAULT_WIGGLE_FACTOR,
): number {
  const scheduledGoals = makeSchedule(goals)

  const totalVolume = goals.reduce((sum, { volume }) => sum.add(volume), duration(0))
  const maxMinutes = scheduledGoalsArray(scheduledGoals)
    .reduce((sum, { activityChunks, potentialExtraActivitySum }) =>
      sum.add(sumVolume(activityChunks)).add(potentialExtraActivitySum), duration(0))
    .asMinutes()

  const ratio = maxMinutes / totalVolume.asMinutes() / wiggleFactor
  return maxMinutes < totalVolume.asMinutes() ? 0 : ratio
}
