// @flow
import makeSchedule from './makeSchedule'
import { periodOn } from './periods'
import { thirtyMinuteGoal, twoHourGoal, fortyMinutesOpenings, twoHoursOpenings, threeHoursOpenings } from '../test/fixtures'

describe('makeSchedule', () => {
  it('arranges one goal into a schedule of non-overlapping activity chunks', () => {
    const schedule = makeSchedule([{ ...thirtyMinuteGoal, openings: fortyMinutesOpenings }])
    const { startDate } = thirtyMinuteGoal
    expect(schedule).toMatchObject({
      [thirtyMinuteGoal.id]: {
        openings: [
          periodOn(startDate.clone().add(3, 'days'), { h: 8 }, { h: 8, m: 10 }),
        ],
        activityChunks: [
          periodOn(startDate, { h: 8 }, { h: 8, m: 10 }),
          periodOn(startDate.clone().add(1, 'days'), { h: 8 }, { h: 8, m: 10 }),
          periodOn(startDate.clone().add(2, 'days'), { h: 8 }, { h: 8, m: 10 }),
        ],
      },
    })

    expect(makeSchedule([{ ...twoHourGoal, openings: twoHoursOpenings }])).toMatchObject({
      [twoHourGoal.id]: {
        openings: [],
        activityChunks: twoHoursOpenings,
      },
    })
  })


  it('arranges two goals into a schedule of non-overlapping activity chunks', () => {
    const schedule = makeSchedule([
      { ...thirtyMinuteGoal, openings: threeHoursOpenings },
      { ...twoHourGoal, openings: threeHoursOpenings },
    ])
    const { startDate } = thirtyMinuteGoal
    expect(schedule).toMatchObject({
      [thirtyMinuteGoal.id]: {
        openings: [
          periodOn(startDate.clone().add(3, 'days'), { h: 8 }, { h: 8, m: 10 }),
        ],
        activityChunks: [
          periodOn(startDate, { h: 8 }, { h: 8, m: 10 }),
          periodOn(startDate.clone().add(1, 'days'), { h: 8 }, { h: 8, m: 10 }),
          periodOn(startDate.clone().add(2, 'days'), { h: 8 }, { h: 8, m: 10 }),
        ],
      },
      [twoHourGoal.id]: {
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
    })
  })

  // we're currently handling big-max-chunk goals first, but what if one goal has
  // small chunks but high minimum intervals, and another has big max-chunks, but
  // small min-chunks and lower minimum intervals? is there a situation where the
  // big-max-chunk-first makes `makeSchedule` fail when the schedule is theoretically possible?
})
