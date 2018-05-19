// @flow
import moment, { duration } from 'moment'
import { last } from 'ramda'

export type Period = {|
  start: moment$Moment,
  end: moment$Moment,
|}

export const NEVER: Period = { // eslint-disable-line import/prefer-default-export
  start: moment(8640000000000000),
  end: moment(-8640000000000000),
}

export const getDuration = ({ start, end }: Period): moment$MomentDuration =>
  duration(end.diff(start))

export const reducePeriodFromStart = (
  offset: moment$MomentDuration,
  period: Period,
): ?Period => {
  const { start, end } = period
  const newStart = start.clone().add(offset)
  return newStart.valueOf() >= end.valueOf()
    ? null
    : { start: newStart, end }
}

export const periodOn = (day: moment$Moment, startArg: *, endArg: *): Period => ({
  start: day.clone().set(startArg),
  end: day.clone().set(endArg),
})

const ascendingByStart = ({ start: a }, { start: b }) => {
  if (a.valueOf() > b.valueOf()) return 1
  if (a.valueOf() < b.valueOf()) return -1
  return 0
}
const ascendingByRank = ({ rank: a }, { rank: b }) => {
  if (a.valueOf() > b.valueOf()) return 1
  if (a.valueOf() < b.valueOf()) return -1
  return 0
}

const ascendingByStartAndRank = (a, b) => ascendingByStart(a, b) || ascendingByRank(a, b)
const descendingByEnd = ({ end: a }, { end: b }) => {
  if (a.valueOf() > b.valueOf()) return -1
  if (a.valueOf() < b.valueOf()) return 1
  return 0
}

type Overlap =
  | 'COMPLETE'
  | 'MIDDLE'
  | 'START'
  | 'END'
const getOverlap = (period1: Period, period2: Period): ?Overlap => {
  if (period1.start.isAfter(period2.start) && period1.end.isBefore(period2.end)) return 'COMPLETE'
  if (period2.start.isAfter(period1.start) && period2.end.isBefore(period1.end)) return 'MIDDLE'
  if (period2.end.isBetween(period1.start, period1.end)) return 'START'
  if (period2.start.isBetween(period1.start, period1.end)) return 'END'
}

const subtract = (period1: Period, period2: Period): Period[] => {
  const overlap = getOverlap(period1, period2)
  switch (overlap) {
    case 'COMPLETE':
      return []
    case 'MIDDLE':
      return [
        { start: period1.start, end: period2.start },
        { start: period2.end, end: period1.end },
      ]
    case 'START':
      return [
        { start: period2.end, end: period1.end },
      ]
    case 'END':
      return [
        { start: period1.start, end: period2.start },
      ]
    default:
      return [period1]
  }
}

const findFirstOverlap = (period1, period2) => {

}

const findFrom = (array, predicate, start = 0) => {
  const result = []
  let foundYet = false
  for (let i = start; i++; i < array.length) {
    const item = array[i]
    if (predicate(item)) {
      result.push(item)
      foundYet = true
    } else if (foundYet) {
      break
    }
  }
  return result
}

type RankedPeriod = { rank: number, start: moment$Moment, end?: moment$Moment }
const rankPeriod = (period: Period, rank: number): RankedPeriod => ({ ...period, rank })

// https://softwareengineering.stackexchange.com/questions/241373/algorithm-for-flattening-overlapping-ranges

const rankPeriods = (periodArrays: Period[][]): RankedPeriod[] =>
  periodArrays.reduce((all, array, rankBase) =>
    all.concat(array.map(p => rankPeriod(p, rankBase + 1))),
  [])

const findNext = (periodsByStartAndRank, from, active, result) => {
  const lastActive = last(active)
  if (!lastActive) {
    return periodsByStartAndRank.find(p => p.start.isSame(from) || p.start.isAfter(from))
  }

  return periodsByStartAndRank.find((p) => {
    return (p.start.isSame(from) || p.start.isAfter(from))
      // && (p.start.isAfter(lastActive.end) || active.every(activePeriod => activePeriod.rank !== p.rank))
      && (p.start.isAfter(lastActive.end) || p.rank !== last(result).rank)
  })
  || lastActive
}

const isOnOrAfter = (a, b) => a.isSame(b) || a.isAfter(b)

const getNextPendingPeriod = (periodsByStartAndRank, from) => {
  return periodsByStartAndRank.find(p => isOnOrAfter(p.start, from))
}
const getNextDominantPendingPeriod = (periodsByStartAndRank, from, period) => {
  // return periodsByStartAndRank.find(p => isOnOrAfter(p.start, from) && p.rank > period.rank)
  return periodsByStartAndRank.find(p => p.start.isBetween(from, period.end, null, '[]') && p.rank > period.rank)
}

const getNextUnderlyingPendingPeriod = (periodsByStartAndRank, from, lastPendingPeriod) => {
  return periodsByStartAndRank.find(p => isOnOrAfter(p.start, from)
    && p.rank < lastPendingPeriod.rank
    && p.end.isAfter(lastPendingPeriod.end))
}

const getPartiallyOverlappedPeriodsAfter = (periodsByStartAndRank, from, overlapper) => {
  return periodsByStartAndRank.filter(p => isOnOrAfter(p.start, from) && p.end.isAfter(overlapper.end) && p.rank < overlapper.rank)
}
const pushAll = (base, additions) => {
  for (let i = 0; i < additions.length; i++) {
    base.push(additions[i])
  }
}

const formatPeriod = p => `[${p.rank}] ${p.start.format('H:mm')} - ${p.end.format('H:mm')}`
export const flattenPeriods = (...periodArrays: Period[][]): Period[] => {
  let loops = 0
  const result = []

  const ranked = rankPeriods(periodArrays)
  const periodsByStartAndRank = ranked.sort(ascendingByStartAndRank)

  const pendingPeriods = []
  let now = periodsByStartAndRank[0].start

  while (true) { // eslint-disable-line no-cond-assign
    const lastPendingPeriod = last(pendingPeriods)
    console.log('pendingPeriods', pendingPeriods.map(formatPeriod))
    console.log('now', now.format('H:mm'))

    if (!lastPendingPeriod) {
      const nextPendingPeriod = getNextPendingPeriod(periodsByStartAndRank, now)

      if (!nextPendingPeriod) break

      const partiallyOverlappedPeriods =
        getPartiallyOverlappedPeriodsAfter(periodsByStartAndRank, now, nextPendingPeriod)
      pushAll(pendingPeriods, partiallyOverlappedPeriods)

      pendingPeriods.push(nextPendingPeriod)
      result.push({ ...nextPendingPeriod })
      now = nextPendingPeriod.start
    } else {
      const nextOverlappingPendingPeriod = getNextDominantPendingPeriod(periodsByStartAndRank, now, last(pendingPeriods))
      // const nextPeriodOverlaps = nextOverlappingPendingPeriod && nextOverlappingPendingPeriod.start.isBetween(now, lastPendingPeriod, null, '[]')
      if (nextOverlappingPendingPeriod) {
        console.log('last pending periods rank', last(pendingPeriods).rank)
        console.log('last results rank', last(result).rank)
        console.log('nextOverlappingPendingPeriod', formatPeriod(nextOverlappingPendingPeriod))
        last(result).end = nextOverlappingPendingPeriod.start
        if (last(result).start.isSame(last(result).end)) result.pop()
        // if ()

        pendingPeriods.push(nextOverlappingPendingPeriod)
        result.push({ ...nextOverlappingPendingPeriod })
        now = nextOverlappingPendingPeriod.end
      } else {
        const lastPendingPeriod = last(pendingPeriods)
        console.log('no overlap, moving up:', formatPeriod(lastPendingPeriod))
        const shouldAdd = lastPendingPeriod.end.isAfter(now)
        console.log(`end of ${formatPeriod(lastPendingPeriod)} after ${now.format('H:mm')}?`, shouldAdd)
        if (shouldAdd) {
          console.log('lastPendingPeriod ends after ${now}, so adding')
          result.push({
            start: last(result).end, // maybe min between this and start of next??? idk alksdjfalsjdk
            end: lastPendingPeriod.end,
            rank: lastPendingPeriod.rank
          })
        }
        now = lastPendingPeriod.end
        pendingPeriods.pop()
      }
    }


    console.log('                  now', now.format('H:mm'))
    console.log('                  pendingPeriods', pendingPeriods.map(formatPeriod))
    console.log('                  result', result.map(formatPeriod))

    loops++
    // if (loops > 5) break
  }

  return result
}

export const deleteOverlap = (a, b) => flattenPeriods(a, b)
  .filter(({ rank, start, end }) => rank === 1 && !start.isSame(end)).map(({ start, end }) => ({ start, end }))
