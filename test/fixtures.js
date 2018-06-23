// @flow
import moment, { duration } from 'moment'
import type { Goal } from '../src/goals'
import { periodOn } from '../src/periods'

export const readTwoBookChapters : Goal = {
  name: 'Read two book chapters',
  id: '1',
  startDate: moment('2018-01-01'),
  endDate: moment('2018-01-07'),
  volume: duration(2, 'hours'),
  chunking: {
    min: duration(30, 'minutes'),
    max: duration(60, 'minutes'),
  },
  interval: {
    max: duration(90, 'minutes'),
  },
  priority: 1,
  openings: [],
}

export const workOutThreeTimesWeekly : Goal = {
  name: 'Work out 3 times a week',
  id: '2',
  startDate: moment('2018-01-01'),
  endDate: moment('2018-01-07'),
  volume: duration(30, 'minutes'),
  chunking: {
    min: duration(10, 'minutes'),
    max: duration(10, 'minutes'),
  },
  interval: {
    max: duration(12, 'hours'),
  },
  priority: 2,
  openings: [],
}

export const thirtyMinuteGoal = {
  ...workOutThreeTimesWeekly,
  volume: duration(30, 'minutes'),
  chunking: {
    min: duration(10, 'minutes'),
    max: duration(10, 'minutes'),
  },
  interval: {},
}
const { startDate, endDate } = thirtyMinuteGoal
export const twoHourGoal = {
  ...readTwoBookChapters,
  startDate,
  endDate,
  volume: duration(2, 'hours'),
  chunking: {
    min: duration(30, 'minutes'),
    max: duration(30, 'minutes'),
  },
  interval: {},
}

export const fortyMinutesOpenings = [
  // enough for thirtyMinuteGoal, with excess
  periodOn(startDate, { h: 8 }, { h: 8, m: 10 }),
  periodOn(startDate.clone().add(1, 'days'), { h: 8 }, { h: 8, m: 10 }),
  periodOn(startDate.clone().add(2, 'days'), { h: 8 }, { h: 8, m: 10 }),
  // this last one should be left over:
  periodOn(startDate.clone().add(3, 'days'), { h: 8 }, { h: 8, m: 10 }),
]

export const twoHoursOpenings = [
  // just enough for twoHourGoal
  periodOn(startDate, { h: 9 }, { h: 9, m: 30 }),
  periodOn(startDate.clone().add(1, 'days'), { h: 9 }, { h: 9, m: 30 }),
  periodOn(startDate.clone().add(2, 'days'), { h: 9 }, { h: 9, m: 30 }),
  periodOn(startDate.clone().add(3, 'days'), { h: 9 }, { h: 9, m: 30 }),
]

export const threeHoursOpenings = [
  ...fortyMinutesOpenings,
  ...twoHoursOpenings,
]
