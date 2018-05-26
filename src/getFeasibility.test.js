// @flow
import { duration } from 'moment'
import getFeasibility from './getFeasibility'
import { periodOn } from './periods'
import { workOutThreeTimesWeekly, readTwoBookChapters } from '../test/fixtures'

describe('getFeasibility', () => {
  it('returns 0 if there is no chance of finishing goals within schedule DUE TO VOLUME', () => {
    const { startDate } = workOutThreeTimesWeekly
    const openings = [
      periodOn(startDate, { h: 8, m: 0 }, { h: 8, m: 1 }),
    ]
    const thirtyMinuteGoal = {
      ...workOutThreeTimesWeekly,
      volume: duration(30, 'minutes'),
      startDate,
      openings,
    }

    expect(getFeasibility([thirtyMinuteGoal])).toEqual(0)
  })

  it('returns 0 if there is no chance of finishing goals within schedule DUE TO CHUNKING', () => {
    const { startDate } = readTwoBookChapters
    const smallOpenings = [
      periodOn(startDate, { h: 8, m: 0 }, { h: 8, m: 20 }),
      periodOn(startDate.clone().add(1, 'days'), { h: 8, m: 0 }, { h: 8, m: 20 }),
      periodOn(startDate.clone().add(2, 'days'), { h: 8, m: 0 }, { h: 8, m: 20 }),
      periodOn(startDate.clone().add(3, 'days'), { h: 8, m: 0 }, { h: 8, m: 20 }),
      periodOn(startDate.clone().add(4, 'days'), { h: 8, m: 0 }, { h: 8, m: 20 }),
      periodOn(startDate.clone().add(5, 'days'), { h: 8, m: 0 }, { h: 8, m: 20 }),
      periodOn(startDate.clone().add(6, 'days'), { h: 8, m: 0 }, { h: 8, m: 20 }),
    ]
    const twoHourGoal = {
      ...readTwoBookChapters,
      volume: duration(2, 'hours'),
      chunking: {
        min: duration(30, 'minutes'),
        max: duration(90, 'minutes'),
      },
      startDate,
      openings: smallOpenings,
    }

    expect(getFeasibility([twoHourGoal])).toEqual(0)
  })

  it('returns 0 if there is no chance of finishing goals within schedule DUE TO RESTING PERIOD (too much time between chunks)', () => {
    const { startDate } = workOutThreeTimesWeekly
    const openings = [
      periodOn(startDate, { h: 8, m: 0 }, { h: 9, m: 0 }),
    ]
    const thirtyMinuteGoalWithOneDayRest = {
      ...workOutThreeTimesWeekly,
      volume: duration(30, 'minutes'),
      interval: { min: duration(12, 'hours') },
      startDate,
      openings,
    }

    expect(getFeasibility([thirtyMinuteGoalWithOneDayRest])).toEqual(0)
  })

  it('returns 1 if goals fit within schedule with 3:4 goal-volume-to-openings ratio with wiggle factor of 4/3', () => {
    const { startDate } = workOutThreeTimesWeekly
    const openings = [
      periodOn(startDate, { h: 8, m: 0 }, { h: 8, m: 45 }),
    ]
    const thirtyMinuteGoal = {
      ...workOutThreeTimesWeekly,
      volume: duration(30, 'minutes'),
      startDate,
      openings,
    }

    expect(getFeasibility([thirtyMinuteGoal], 4 / 3)).toEqual(1)
  })

  it('returns 1 if goals fit within schedule with 1:1 goal-volume-to-openings ratio', () => {
    const { startDate } = workOutThreeTimesWeekly
    const openings = [
      periodOn(startDate, { h: 8, m: 0 }, { h: 9, m: 0 }),
    ]
    const thirtyMinuteGoal = {
      ...workOutThreeTimesWeekly,
      volume: duration(30, 'minutes'),
      interval: {},
      startDate,
      openings,
    }

    expect(getFeasibility([thirtyMinuteGoal])).toEqual(1)
  })

  // start with goal of highest priority, and distribute activity chunks among availabilities.
  // should be early as possible, because early is generally safer and also since we want to
  // maximize the leftover chunkage for the remaining goals, and don't want to leave unusuable
  // slivers at either end of the opening.
  describe('with multiple goals', () => {
    // goals volume total 2 hours and 30 minutes
    // free time 3 hours
    // also, all the right amount of resting time
    it('returns 0 when there is no wiggle room even though goals technically fit', () => {
      const { startDate, endDate } = workOutThreeTimesWeekly
      const threeHoursOpenings = [
        periodOn(startDate, { h: 8 }, { h: 8, m: 10 }),
        periodOn(startDate.clone().add(1, 'days'), { h: 8 }, { h: 8, m: 10 }),
        periodOn(startDate.clone().add(2, 'days'), { h: 8 }, { h: 8, m: 10 }),
        periodOn(startDate, { h: 9 }, { h: 9, m: 30 }),
        periodOn(startDate.clone().add(1, 'days'), { h: 9 }, { h: 9, m: 30 }),
        periodOn(startDate.clone().add(2, 'days'), { h: 9 }, { h: 9, m: 30 }),
      ]

      const thirtyMinuteGoal = {
        ...workOutThreeTimesWeekly,
        startDate,
        endDate,
        volume: duration(30, 'minutes'),
        interval: {},
      }
      const twoHourGoal = {
        ...readTwoBookChapters,
        startDate,
        endDate,
        volume: duration(2, 'hours'),
        interval: {},
        openings: threeHoursOpenings,
      }

      expect(getFeasibility([thirtyMinuteGoal, twoHourGoal])).toEqual(0)
    })

    // enough time for goals 1 and 3 but not goals 1 and 2
    it('returns 0') // but how do we express that maybe user would want to move goal 3 up in priority?
  })
})
