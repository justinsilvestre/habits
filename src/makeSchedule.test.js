// @flow
import { duration } from 'moment'
import makeSchedule from './makeSchedule'
import { periodOn } from './periods'
import { workOutThreeTimesWeekly, readTwoBookChapters } from '../test/fixtures'

describe('makeSchedule', () => {
  it('arranges goals into a schedule of non-overlapping activity chunks', () => {
    const thirtyMinuteGoal = {
      ...workOutThreeTimesWeekly,
      volume: duration(30, 'minutes'),
      interval: {},
    }
    const { startDate, endDate } = thirtyMinuteGoal
    const twoHourGoal = {
      ...readTwoBookChapters,
      startDate,
      endDate,
      volume: duration(2, 'hours'),
      interval: {},
    }
    const threeHoursOpenings = [
      periodOn(startDate, { h: 8 }, { h: 8, m: 10 }),
      periodOn(startDate.clone().add(1, 'days'), { h: 8 }, { h: 8, m: 10 }),
      periodOn(startDate.clone().add(2, 'days'), { h: 8 }, { h: 8, m: 10 }),
      periodOn(startDate.clone().add(3, 'days'), { h: 8 }, { h: 8, m: 10 }),
      periodOn(startDate, { h: 9 }, { h: 9, m: 30 }),
      periodOn(startDate.clone().add(1, 'days'), { h: 9 }, { h: 9, m: 30 }),
      periodOn(startDate.clone().add(2, 'days'), { h: 9 }, { h: 9, m: 30 }),
      periodOn(startDate.clone().add(3, 'days'), { h: 9 }, { h: 9, m: 30 }),
    ]

    expect(makeSchedule([
      { goal: thirtyMinuteGoal, openings: threeHoursOpenings },
      { goal: twoHourGoal, openings: threeHoursOpenings },
    ])).toEqual([
      {
        goal: thirtyMinuteGoal,
        openings: [
          periodOn(startDate.clone().add(3, 'days'), { h: 8 }, { h: 8, m: 10 }),
        ],
        activityChunks: [
          periodOn(startDate, { h: 8 }, { h: 8, m: 10 }),
          periodOn(startDate.clone().add(1, 'days'), { h: 8 }, { h: 8, m: 10 }),
          periodOn(startDate.clone().add(2, 'days'), { h: 8 }, { h: 8, m: 10 }),
        ],
      },
      {
        goal: twoHourGoal,
        openings: [
          periodOn(startDate.clone().add(3, 'days'), { h: 8 }, { h: 8, m: 10 }),
        ],
        activityChunks: [
          periodOn(startDate, { h: 9 }, { h: 9, m: 30 }),
          periodOn(startDate.clone().add(1, 'days'), { h: 9 }, { h: 9, m: 30 }),
          periodOn(startDate.clone().add(2, 'days'), { h: 9 }, { h: 9, m: 30 }),
          periodOn(startDate.clone().add(3, 'days'), { h: 9 }, { h: 9, m: 30 }),
        ],
      },
    ])
  })
})
