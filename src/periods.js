// @flow
import moment, { duration } from 'moment'
import R from 'ramda'

export type Period = {
  start: moment$Moment,
  end: moment$Moment,
}

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

type RankedPeriod = { rank: number, start: moment$Moment, end: moment$Moment }
const rankPeriod = (period: Period, rank: number): RankedPeriod => ({ ...period, rank })

const rankPeriods = (periodArrays: Period[][]): RankedPeriod[] =>
  periodArrays.reduce(
    (all, array, rankBase) =>
      all.concat(array.map(p => rankPeriod(p, rankBase + 1))),
    [],
  )

const isOnOrAfter = (a, b) => a.isSame(b) || a.isAfter(b)

const getNextPendingPeriod = (
  periodsByStartAndRank: RankedPeriod[],
  from: moment$Moment,
): ?RankedPeriod => {
  let firstIndex
  const first = periodsByStartAndRank.find((p, i) => {
    firstIndex = i
    return isOnOrAfter(p.start, from)
  })

  if (!first) return undefined

  let latestFollowingPeriodOfSameRank

  for (let i = firstIndex + 1; i < periodsByStartAndRank.length; i++) { // eslint-disable-line
    const period = periodsByStartAndRank[i]
    if (period.start.isSame(first.start)) {
      latestFollowingPeriodOfSameRank = period
    } else {
      break
    }
  }

  return latestFollowingPeriodOfSameRank || first
}

const getNextDominantPendingPeriod = (
  periodsByStartAndRank: RankedPeriod[],
  from: moment$Moment,
  period: RankedPeriod,
): ?RankedPeriod =>
  periodsByStartAndRank.find(p => p.start.isBetween(from, period.end, null, '[]') && p.rank > period.rank)

const getPartiallyOverlappedPeriodsAfter = (
  periodsByStartAndRank: RankedPeriod[],
  from: moment$Moment,
  overlapper: RankedPeriod,
): RankedPeriod[] =>
  periodsByStartAndRank.filter(p =>
    p.start.isBetween(overlapper.start, overlapper.end, null, '[]') && p.end.isAfter(overlapper.start) && p.rank < overlapper.rank)
const pushAll = (base, additions) => {
  for (let i = 0; i < additions.length; i++) { // eslint-disable-line
    base.push(additions[i])
  }
}

// infinite loop when invalid period is given!!!
export const flattenPeriods = (...periodArrays: Period[][]): RankedPeriod[] => {
  const result = []

  const ranked = rankPeriods(periodArrays)
  const periodsByStartAndRank = ranked.sort(ascendingByStartAndRank)
  const pendingPeriods = []
  if (!periodsByStartAndRank[0]) throw new Error('empty array of periods')
  let now = periodsByStartAndRank[0].start

  while (true) { // eslint-disable-line no-constant-condition
    const lastPendingPeriod = R.last(pendingPeriods)

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
      const nextOverlappingPendingPeriod =
        getNextDominantPendingPeriod(periodsByStartAndRank, now, lastPendingPeriod)
      const lastResult = R.last(result)
      if (!lastResult) throw new Error('Empty results array')

      if (nextOverlappingPendingPeriod) {
        lastResult.end = nextOverlappingPendingPeriod.start
        pendingPeriods.push(nextOverlappingPendingPeriod)
        result.push({ ...nextOverlappingPendingPeriod })
        now = nextOverlappingPendingPeriod.start
      } else {
        const shouldAdd = lastPendingPeriod.end.isAfter(lastResult.end)
        if (shouldAdd) {
          result.push({
            start: lastResult.end,
            end: lastPendingPeriod.end,
            rank: lastPendingPeriod.rank,
          })
        }
        pendingPeriods.pop()
        now = lastResult.end
      }
    }
  }

  return result
}

export const deleteOverlap = (a: Period[], b: Period[]): Period[] =>
  flattenPeriods(a, b)
    .filter(({ rank }) => rank === 1)
    .map(({ start, end }) => ({ start, end }))
