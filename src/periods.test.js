// @flow
import moment from 'moment'
import { flattenPeriods } from './periods'
import type { Period } from './periods'

const period = (start, end) => ({ start: moment(start), end: moment(end), toString })

const TIME_FORMAT = 'H:mm'
const format = ({ start, end }: Period) =>
  `${start.format(TIME_FORMAT)} - ${end.format(TIME_FORMAT)}`

const flattenPeriodsAndFormat = (...periodsArrays) =>
  flattenPeriods(...periodsArrays)
    .reduce((all, p) => {
      const { rank } = p;

      (all[rank] = all[rank] || []) // eslint-disable-line no-param-reassign
        .push(format(p))

      return all
    }, {})

describe('flattenPeriods', () => {
  it('leaves alone no overlap', () => {
    const under = [
      {
        start: moment('2018-01-04T08:00:00.000'),
        end: moment('2018-01-04T08:10:00.000'),
      },
    ]
    const over = [
      {
        start: moment('2018-01-01T08:00:00.000'),
        end: moment('2018-01-01T08:10:00.000'),
      },
      {
        start: moment('2018-01-02T08:00:00.000'),
        end: moment('2018-01-02T08:10:00.000'),
      },
      {
        start: moment('2018-01-03T08:00:00.000'),
        end: moment('2018-01-03T08:10:00.000'),
      },
    ]

    expect(flattenPeriods(under, over)).toEqual([
      { ...over[0], rank: 2 },
      { ...over[1], rank: 2 },
      { ...over[2], rank: 2 },
      { ...under[0], rank: 1 },
    ])
  })
  it('deletes overlap at end', () => {
    const under = [
      period({ h: 1 }, { h: 3 }),
    ]
    const over = [
      period({ h: 2 }, { h: 3 }),
    ]

    expect(flattenPeriodsAndFormat(under, over)).toEqual({
      '1': ['1:00 - 2:00'],
      '2': ['2:00 - 3:00'],
    })
  })

  it('deletes overlap at start', () => {
    const under = [
      period({ h: 1 }, { h: 3 }),
    ]
    const over = [
      period({ h: 1 }, { h: 2 }),
    ]

    expect(flattenPeriodsAndFormat(under, over)).toEqual({
      '1': ['2:00 - 3:00'],
      '2': ['1:00 - 2:00'],
    })
  })

  it('deletes overlap in middle', () => {
    const under = [
      period({ h: 1 }, { h: 4 }),
    ]
    const over = [
      period({ h: 2 }, { h: 3 }),
    ]
    expect(flattenPeriodsAndFormat(under, over)).toEqual({
      '1': ['1:00 - 2:00', '3:00 - 4:00'],
      '2': ['2:00 - 3:00'],
    })
  })

  it('flattens two arrays of periods', () => {
    const under = [
      period({ h: 8 }, { h: 11 }),
      period({ h: 12 }, { h: 15 }),
      period({ h: 16 }, { h: 19 }),
      period({ h: 20 }, { h: 24 }),
    ]
    const over = [
      period({ h: 8 }, { h: 9 }),
      period({ h: 13 }, { h: 14 }),
      period({ h: 18 }, { h: 19 }),
      period({ h: 21 }, { h: 23 }),
    ]

    expect(flattenPeriodsAndFormat(under, over)).toEqual({
      '1': [
        '9:00 - 11:00',
        '12:00 - 13:00',
        '14:00 - 15:00',
        '16:00 - 18:00',
        '20:00 - 21:00',
        '23:00 - 0:00',
      ],
      '2': [
        '8:00 - 9:00',
        '13:00 - 14:00',
        '18:00 - 19:00',
        '21:00 - 23:00',
      ],
    })
  })

  it('flattens three arrays of periods', () => {
    const first = [
      period({ h: 7 }, { h: 12 }),
    ]
    const second = [
      period({ h: 8 }, { h: 11 }),
    ]

    const third = [
      period({ h: 9 }, { h: 10 }),
    ]

    expect(flattenPeriodsAndFormat(first, second, third)).toEqual({
      '1': [
        '7:00 - 8:00',
        '11:00 - 12:00',
      ],
      '2': [
        '8:00 - 9:00',
        '10:00 - 11:00',
      ],
      '3': [
        '9:00 - 10:00',
      ],
    })
  })

  it('flattens multiple wholly covered periods', () => {
    const under = [
      period({ h: 8 }, { h: 11 }),
      period({ h: 12 }, { h: 15 }),
      period({ h: 16 }, { h: 19 }),
      period({ h: 20 }, { h: 24 }),
    ]
    const over = [
      period({ h: 8 }, { h: 24 }),
    ]

    expect(flattenPeriodsAndFormat(under, over)).toEqual({
      '2': ['8:00 - 0:00'],
    })
  })
})
