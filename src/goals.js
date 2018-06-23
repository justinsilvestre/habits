// @flow
import type { Period } from './periods'
import type { Schedule } from './schedules'

export type GoalChunking = {
  min: moment$MomentDuration,
  max: moment$MomentDuration,
}

export type UnscheduledGoal = {
  name: string,
  id: string,
  startDate: moment$Moment,
  endDate: moment$Moment,
  volume: moment$MomentDuration,
  chunking: GoalChunking,
  interval: {
    min?: moment$MomentDuration,
    max?: moment$MomentDuration,
  },
  priority: number,
  openings: Array<Period>,
}

export type Goal = $Exact<UnscheduledGoal>

export type ScheduledGoal = Goal & {
  schedule: Schedule,
}
