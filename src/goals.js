// @flow
import type { Period } from './periods'

type GoalChunking = {
  min: moment$MomentDuration,
  max: moment$MomentDuration,
}

export type Goal = {|
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
  activityChunks: Array<Period>,
|}
