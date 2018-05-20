// @flow
import moment, { duration } from 'moment'
import type { Goal } from '../src/goals'

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
  activityChunks: [],
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
  activityChunks: [],
  openings: [],
}
