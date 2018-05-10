// @flow

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
