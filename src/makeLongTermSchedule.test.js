// @flow
import moment, { duration } from 'moment'
import R from 'ramda'
import makeLongTermSchedule, { extendWeeklyOpenings } from './makeLongTermSchedule'
import { thirtyMinuteGoal, twoHourGoal } from '../test/fixtures'
import { periodOn } from './periods'
import { formatPeriod } from '../test/helpers'

describe('extendWeeklyOpenings', () => {
  it('extends weekly openings to goal span', () => {
    const baseGoal = {
      ...thirtyMinuteGoal,
      startDate: moment({ y: 2018, M: 0, d: 1 }),
      endDate: moment({ y: 2018, M: 0, d: 14 }),
    }
    const { startDate } = baseGoal
    const weeklyOpenings = [
      periodOn(startDate, { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 1 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 2 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 3 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 4 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 5 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 6 }), { h: 8 }, { h: 9 }),
    ]
    const goal = {
      ...baseGoal,
      openings: weeklyOpenings,
    }

    expect(extendWeeklyOpenings(goal, weeklyOpenings).map(formatPeriod))
      .toEqual(R.range(1, 15).map(n => ({
        start: moment({
          y: 2018, M: 0, D: n, h: 8,
        }),
        end: moment({
          y: 2018, M: 0, D: n, h: 9,
        }),
      })).map(formatPeriod))
  })

  it('works when goal starts/ends in the middle of the week')
})

describe('makeLongTermSchedule', () => {
  it('doesnt crash', (done) => {
    const oneHourDailyForTwoMonths = duration(31 * 2, 'hours')
    const baseGoal = {
      ...twoHourGoal,
      startDate: moment({ y: 2018, M: 0, d: 1 }),
      endDate: moment({ y: 2018, M: 2, d: 31 }),
      volume: oneHourDailyForTwoMonths,
    }
    const { startDate, endDate } = baseGoal
    const weeklyOpenings = [
      periodOn(startDate, { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 1 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 2 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 3 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 4 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 5 }), { h: 8 }, { h: 9 }),
      periodOn(startDate.clone().add({ d: 6 }), { h: 8 }, { h: 9 }),
    ]
    const goal = {
      ...baseGoal,
      openings: weeklyOpenings,
      chunking: {
        min: duration(30, 'minutes'),
        max: duration(60, 'minutes'),
      },
    }
    const interruptions = [
      {
        start: startDate.clone().add({ M: 1 }),
        end: startDate.clone().add({ M: 2 }),
      },
    ]

    const activityChunks = [
      ...extendWeeklyOpenings({
        startDate,
        endDate: startDate.clone().set({ D: 31 }),
      }, weeklyOpenings),
      ...extendWeeklyOpenings({
        startDate: endDate.clone().set({ D: 1 }),
        endDate,
      }, weeklyOpenings),
    ]

    const longTermSchedule = makeLongTermSchedule([goal], interruptions)
    expect(longTermSchedule[goal.id].activityChunks).toEqual(activityChunks)

    done()
  })
})
