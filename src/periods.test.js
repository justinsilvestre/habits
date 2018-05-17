// @flow
import moment from 'moment'
import { flattenPeriods } from './periods'
import type { Period } from './periods'

const period = (start, end) => ({ start: moment(start), end: moment(end) })

const format = ({ start, end, rank }: Period) =>
// `[${rank}] ${start.format('H:mm')} - ${end.format('H:mm')}`
  `${start.format('H:mm')} - ${end.format('H:mm')}`
// const format = v =>  v
describe('flattenPeriods', () => {
  it('deletes overlap at end', () => {
    const openings = [
      period({ h: 1 }, { h: 3 }),
    ]
    const activityBlocks = [
      period({ h: 2 }, { h: 3 }),
    ]

    expect(flattenPeriods(openings, activityBlocks).filter(p => p.rank === 1).map(format)).toEqual([
      period({ h: 1 }, { h: 2 }),
    ].map(format))
    expect(flattenPeriods(openings, activityBlocks).filter(p => p.rank === 2).map(format)).toEqual([
      period({ h: 2 }, { h: 3 }),
    ].map(format))
  })

  it('deletes overlap at start', () => {
    const openings = [
      period({ h: 1 }, { h: 3 }),
    ]
    const activityBlocks = [
      period({ h: 1 }, { h: 2 }),
    ]

    expect(flattenPeriods(openings, activityBlocks).filter(p => p.rank === 1).map(format)).toEqual([
      period({ h: 2 }, { h: 3 }),
    ].map(format))
    expect(flattenPeriods(openings, activityBlocks).filter(p => p.rank === 2).map(format)).toEqual([
      period({ h: 1 }, { h: 2 }),
    ].map(format))
  })

  it('deletes overlap in middle', () => {
    const openings = [
      period({ h: 1 }, { h: 4 }),
    ]
    const activityBlocks = [
      period({ h: 2 }, { h: 3 }),
    ]

    expect(flattenPeriods(openings, activityBlocks).filter(p => p.rank === 1).map(format)).toEqual([
      period({ h: 1 }, { h: 2 }),
      period({ h: 3 }, { h: 4 }),
    ].map(format))
    expect(flattenPeriods(openings, activityBlocks).filter(p => p.rank === 2).map(format)).toEqual([
      period({ h: 2 }, { h: 3 }),
    ].map(format))
  })

  it('flattens two arrays of periods', () => {
    const openings = [
      period({ h: 8 }, { h: 11 }),
      period({ h: 12 }, { h: 15 }),
      period({ h: 16 }, { h: 19 }),
      period({ h: 20 }, { h: 24 }),
    ]
    const activityBlocks = [
      period({ h: 8 }, { h: 9 }),
      period({ h: 13 }, { h: 14 }),
      period({ h: 18 }, { h: 19 }),
      period({ h: 21 }, { h: 23 }),
    ]
    expect(flattenPeriods(openings, activityBlocks).filter(p => p.rank === 1).map(format)).toEqual([
      period({ h: 9 }, { h: 11 }),
      period({ h: 12 }, { h: 13 }),
      period({ h: 14 }, { h: 15 }),
      period({ h: 16 }, { h: 18 }),
      period({ h: 20 }, { h: 21 }),
      period({ h: 23 }, { h: 24 }),
    ].map(format))
    expect(flattenPeriods(openings, activityBlocks).filter(p => p.rank === 2).map(format)).toEqual([
      period({ h: 8 }, { h: 9 }),
      period({ h: 13 }, { h: 14 }),
      period({ h: 18 }, { h: 19 }),
      period({ h: 21 }, { h: 23 }),
    ].map(format))
  })

  // it('flattens three arrays of periods', () => {
  //   const openings = [
  //     period({ h: 8 }, { h: 11 }),
  //     period({ h: 12 }, { h: 15 }),
  //     period({ h: 16 }, { h: 19 }),
  //     period({ h: 20 }, { h: 24 }),
  //   ]
  //   const activityBlocks = [
  //     period({ h: 8 }, { h: 9 }),
  //     period({ h: 13 }, { h: 14 }),
  //     period({ h: 18 }, { h: 19 }),
  //     period({ h: 21 }, { h: 23 }),
  //   ]
  //
  //   const activityBlocks2 = [
  //     period({ h: 8, m: 30 }, { h: 9 }),
  //     period({ h: 13 }, { h: 13, m: 30 }),
  //     period({ h: 18 }, { h: 19 }),
  //     period({ h: 21 }, { h: 23 }),
  //   ]
  //
  //   const flattened = flattenPeriods(openings, activityBlocks, activityBlocks2)
  //
  //   expect((flattened).filter(p => p.rank === 1).map(format)).toEqual([
  //     period({ h: 9 }, { h: 11 }),
  //     period({ h: 12 }, { h: 13 }),
  //     period({ h: 14 }, { h: 15 }),
  //     period({ h: 16 }, { h: 18 }),
  //     period({ h: 20 }, { h: 21 }),
  //     period({ h: 23 }, { h: 24 }),
  //   ].map(format))
  //   expect((flattened).filter(p => p.rank === 2).map(format)).toEqual([
  //     period({ h: 8 }, { h: 9 }),
  //     period({ h: 13 }, { h: 14 }),
  //     period({ h: 18 }, { h: 19 }),
  //     period({ h: 21 }, { h: 23 }),
  //   ].map(format))
  //   expect((flattened).filter(p => p.rank === 3).map(format)).toEqual([
  //     period({ h: 8 }, { h: 9 }),
  //     period({ h: 13 }, { h: 14 }),
  //     period({ h: 18 }, { h: 19 }),
  //     period({ h: 21 }, { h: 23 }),
  //   ].map(format))
  // })

  it('flattens three arrays of periods', () => {
    const openings = [
      period({ h: 7 }, { h: 12 }),
    ]
    const activityBlocks = [
      period({ h: 8 }, { h: 11 }),
    ]

    const activityBlocks2 = [
      period({ h: 9 }, { h: 10 }),
    ]

    const flattened = flattenPeriods(openings, activityBlocks, activityBlocks2)

    const a = (flattened).filter(p => p.rank === 1).map(format)
    const b = (flattened).filter(p => p.rank === 2).map(format)
    const c = (flattened).filter(p => p.rank === 3).map(format)

    expect({ a, b, c }).toEqual({
      a: [
        period({ h: 7 }, { h: 8 }),
        period({ h: 11 }, { h: 12 }),
      ].map(format),
      b: [
        period({ h: 8 }, { h: 9 }),
        period({ h: 10 }, { h: 11 }),
      ].map(format),
      c: [
        period({ h: 9 }, { h: 10 }),
      ].map(format),
    })
  })


})
