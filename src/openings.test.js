// @flow
import moment from 'moment'
import { opening, isAdjacent, consolidateOpenings, getVolume } from './openings'

describe('isAdjacent', () => {
  it('detects adjacent openings', () => {
    const oneToTwo = opening({ h: 1 }, { h: 2 })
    const twoToThree = opening({ h: 2 }, { h: 3 })
    expect(isAdjacent(oneToTwo, twoToThree)).toBe(true)
    expect(isAdjacent(twoToThree, oneToTwo)).toBe(true)
  })

  it('detects non-adjacent openings', () => {
    const oneToTwo = opening({ h: 1 }, { h: 2 })
    const threeToFour = opening({ h: 3 }, { h: 4 })
    expect(isAdjacent(oneToTwo, threeToFour)).toBe(false)
    expect(isAdjacent(threeToFour, oneToTwo)).toBe(false)
  })
})

describe('consolidateOpenings', () => {
  it('combines two adjacent openings into one larger one', () => {
    const adjacentOpenings = [
      opening({ h: 7 }, { h: 8 }),
      opening({ h: 8 }, { h: 9 }),
    ]
    expect(consolidateOpenings(adjacentOpenings)).toEqual([
      opening({ h: 7 }, { h: 9 }),
    ])
  })

  it('combines many adjacent openings into one larger one', () => {
    const adjacentOpenings = [
      opening({ h: 7 }, { h: 8 }),
      opening({ h: 8 }, { h: 9 }),
      opening({ h: 9 }, { h: 11 }),
      opening({ h: 11 }, { h: 15, m: 30 }),
    ]
    expect(consolidateOpenings(adjacentOpenings)).toEqual([
      opening({ h: 7 }, { h: 15, m: 30 }),
    ])
  })

  it('keeps isolated openings unaltered', () => {
    const nonAdjacentOpenings = [
      opening({ h: 7 }, { h: 8 }),
      opening({ h: 9 }, { h: 11 }),
      opening({ h: 11, m: 30 }, { h: 15, m: 30 }),
    ]
    expect(consolidateOpenings(nonAdjacentOpenings)).toEqual(nonAdjacentOpenings)
  })
})

describe('getVolume', () => {
  it('gets volume of opening', () => {
    const volume = getVolume(opening({ h: 7 }, { h: 8 }))
    expect(volume).toBeInstanceOf(moment.duration(0).constructor)
    expect(volume.humanize()).toEqual(moment.duration(1, 'hour').humanize())
  })
})
