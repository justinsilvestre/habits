// @flow
import { duration } from 'moment'
import makeSchedule from './makeSchedule'
import { periodOn } from './periods'
import { workOutThreeTimesWeekly, readTwoBookChapters } from '../test/fixtures'

const thirtyMinuteGoal = {
  ...workOutThreeTimesWeekly,
  volume: duration(30, 'minutes'),
  chunking: {
    min: duration(10, 'minutes'),
    max: duration(10, 'minutes'),
  },
  interval: {},
}
const { startDate, endDate } = thirtyMinuteGoal
const twoHourGoal = {
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

const fortyMinutesOpenings = [
  // enough for thirtyMinuteGoal, with excess
  periodOn(startDate, { h: 8 }, { h: 8, m: 10 }),
  periodOn(startDate.clone().add(1, 'days'), { h: 8 }, { h: 8, m: 10 }),
  periodOn(startDate.clone().add(2, 'days'), { h: 8 }, { h: 8, m: 10 }),
  // this last one should be left over:
  periodOn(startDate.clone().add(3, 'days'), { h: 8 }, { h: 8, m: 10 }),
]

const twoHoursOpenings = [
  // just enough for twoHourGoal
  periodOn(startDate, { h: 9 }, { h: 9, m: 30 }),
  periodOn(startDate.clone().add(1, 'days'), { h: 9 }, { h: 9, m: 30 }),
  periodOn(startDate.clone().add(2, 'days'), { h: 9 }, { h: 9, m: 30 }),
  periodOn(startDate.clone().add(3, 'days'), { h: 9 }, { h: 9, m: 30 }),
]

const threeHoursOpenings = [
  ...fortyMinutesOpenings,
  ...twoHoursOpenings,
]

describe('makeSchedule', () => {
  it('throws an error if there is not enough time', () => {
    const openings = fortyMinutesOpenings.slice(0, 1)
    const makeImpossibleSchedule = () => {
      makeSchedule([{ ...thirtyMinuteGoal, openings }])
    }
    expect(makeImpossibleSchedule).toThrow()
  })

  it('arranges one goal into a schedule of non-overlapping activity chunks', () => {
    const schedule = makeSchedule([{ ...thirtyMinuteGoal, openings: fortyMinutesOpenings }])
    expect(schedule).toEqual({
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

    expect(makeSchedule([{ ...twoHourGoal, openings: twoHoursOpenings }])).toEqual({
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
    expect(schedule).toEqual({
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
