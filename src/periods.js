// @flow
import moment, { duration } from 'moment'
import { flatMap, sortBy, maxBy, reduce, last } from 'ramda'

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

const byStart = ({ start: a }, { start: b }) => {
  if (a.valueOf() > b.valueOf()) return 1
  if (a.valueOf() < b.valueOf()) return -1
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

const getNextPeriod = (pool, currentRank, minStart, currentPeriod) => {
  console.log('currentRank, minStart, currentPeriod')
  console.log(currentRank, minStart.format('H:mm'), currentPeriod)

  if (!currentPeriod || !currentRank) {
    console.log('found', pool.find(p => p.start.isSame(minStart) || p.start.isAfter(minStart)))
    return pool.find(p => p.start.isSame(minStart) || p.start.isAfter(minStart))
  }

  // get either the start of a higher period that will overlap this one
  // or a period that's right after or after this one
  const r = pool.find((p) => {
    return (p.rank > currentRank)
      ? (p.start.isSame(minStart) || p.start.isBetween(minStart, currentPeriod.end)) // (] stuff from moment docs?
      : (p.start.isSame(currentPeriod.end) || p.start.isAfter(currentPeriod.end))
    // if (!(p.rank >= minimumRank)
    //   && p.start.isSame(minStart)
    //   || (p.start.isBetween(minStart, currentPeriod && currentPeriod.end))
  })
  console.log('found', r)
  return r
}

export const flattenPeriods = (...periodArrays: Period[][]): Period[] => {
  const result = []

  const all = rankPeriods(periodArrays).sort(byStart)

  let currentRank = 0
  let now = all[0].start
  let nextPeriod

  while (nextPeriod = getNextPeriod(all, currentRank, now, last(result))) { // eslint-disable-line no-cond-assign
    const lastPeriod = last(result)
    // const overlap = getOverlap(lastPeriod, nextPeriod)

    // we don't need to manage overlap
    if (!lastPeriod || !currentRank) {
      console.log('starting over at', now.format('H:mm'))
      currentRank = nextPeriod.rank
      now = nextPeriod.start
      result.push({
        rank: nextPeriod.rank,
        start: nextPeriod.start,
        end: nextPeriod.end,
      })
      console.log('pushed', last(result))
      console.log('after pushing:', result.length)

    } else { // we do need to manage overlap
      if (nextPeriod.start.isSame(lastPeriod.start)) {
        console.log('next period starts same time as this one!')

        // currentRank = nextPeriod.rank
        // lastPeriod.rank = nextPeriod.rank
        // lastPeriod.end = nextPeriod.end
        result.push({
          rank: lastPeriod.rank,
          start: nextPeriod.end,
          end: lastPeriod.end,
        })
        currentRank = nextPeriod.rank
        lastPeriod.rank = nextPeriod.rank
        lastPeriod.end = nextPeriod.end
        console.log('after pushing:', result.length)

      } else if (nextPeriod.start.isBetween(lastPeriod.start, lastPeriod.end)) {
        console.log('next period starts before this one ends!', 'next rank:', nextPeriod.rank)
        lastPeriod.end = nextPeriod.start
        currentRank = nextPeriod.rank
        result.push({
          rank: nextPeriod.rank,
          start: nextPeriod.start,
          end: nextPeriod.end,
        })
        console.log('after pushing:', result.length)

        // now = lastPeriod.end
        now = nextPeriod.end
        // const unfinishedPeriodUnderNext = all.find(p => now.isBetween(p.start, p.end))
        const unfinishedPeriodUnderNext = reduce(
          maxBy(p => p.rank),
          all.filter(p => now.isBetween(p.start, p.end))
        )
        console.log('unfinishedPeriodUnderNext?', unfinishedPeriodUnderNext)
        if (unfinishedPeriodUnderNext) {
          console.log('still got some colors to fill!')
          result.push({
            rank: unfinishedPeriodUnderNext.rank,
            // start: now,
            start: nextPeriod.end,
            end: unfinishedPeriodUnderNext.end,
          })
          console.log(last(result))
          // now = nextPeriod.start

          currentRank = unfinishedPeriodUnderNext.rank

        } else {
          console.log('hit a blank spot!')

          // now = nextPeriod.start
          currentRank = 0
        }


      } else if (nextPeriod.start.isAfter(lastPeriod.end) || (nextPeriod.start.isSame(lastPeriod.end))) {
        console.log('nextPeriod is after this one!')
          now = nextPeriod.start
          currentRank = 0
      }
      // break
      continue

      // let nextNextPeriod = all.find(p => p.isBetween())
      // lastPeriod.end = nextPeriod.start
      // currentRank -= 1
      // result.push({
      //   rank: nextPeriod.rank,
      //   start: nextPeriod.start,
      //
      // })
    }
  }
console.log('done! result:', result)
  return result

}

export const deleteOverlap = (a, b) => flattenPeriods(a, b)
  .filter(({ rank, start, end }) => rank === 1 && !start.isSame(end)).map(({ start, end }) => ({ start, end }))


// export const deleteOverlap = (base: Period[], top: Period[]): Period[] => {
//   const result = []
//   const all = [
//     ...base.map(p => ranked(p, 1)),
//     ...top.map(p => ranked(p, 2)),
//   ].sort(byStart)
// console.log(all)
//   let overlappingCount = 0
//   let currentMoment = all[0].start
//
//   // while (overlappingCount && all.find(p => p.start.valueOf() > currentMoment.valueOf())) {
//   while (true) {
//     if (!overlappingCount) {
//       console.log('empty slot')
//       const period = all.find(p => p.start.valueOf() >= currentMoment.valueOf())
//       if (!period) break
//       result.push({
//         rank: period.rank,
//         start: period.start,
//         end: period.end,
//       })
//       overlappingCount = period.rank
//     } else {
//       console.log('nonempty slot', overlappingCount)
//
//       const period = all.find(p => p.start.valueOf() >= currentMoment.valueOf() && p.rank > overlappingCount)
//       const lastInResult = last(result)
//       if (period && period.start.valueOf() < lastInResult.end.valueOf()) {
//         console.log('adding a period on top, cause it starts before last one ends')
//         overlappingCount = period.rank
//         lastInResult.end = period.start
//         result.push({
//           rank: period.rank,
//           start: period.start,
//           end: period.end
//         })
//       } else {
//
//         console.log('adding a period after, cause last one ends first')
//         console.log('lastinResult.end', lastInResult.end)
//         console.log('ally', all)
//         currentMoment = lastInResult.end
//         overlappingCount--
//         // const nextHighestPeriod = all.find(p => p.start.valueOf() >= currentMoment.valueOf())
//         const nextHighestPeriod = all.find(p => currentMoment.isBetween(p.start, p.end))
//         // const nextHighestPeriod = all.find(p => p.rank < overlappingCount && p.start.valueOf() >= currentMoment.valueOf())
//         console.log('nextHighestPeriod', nextHighestPeriod)
//         if (nextHighestPeriod) {
//           result.push({
//             rank: nextHighestPeriod.rank,
//             // start: lastInResult.end,
//             start: nextHighestPeriod.start,
//             end: nextHighestPeriod.end,
//           })
//         }
//
//       }
//     }
//     console.log(result)
//   }
//
//   return result
//   .filter(({ rank, start, end }) => rank === 1 && !start.isSame(end)).map(({ start, end }) => ({ start, end }))
// }


// const getNextPrevailingPeriod = (all, currentMoment, overlappingCount) => {
//   if (!overlappingCount) {
//     return all.find(period => period.start.valueOf() >= currentMoment.valueOf())
//   }
//
//   return all.find(period => period.start.valueOf() > currentMoment.valueOf() && period.rank > overlappingCount)
// }
// // const underCurrentPeriod = reduce(maxBy(({ rank }) => rank), { rank: -1 }, followingUnderPeriods)
//
// export const dreleteOverlap = (base: Period[], top: Period[]): Period[] => {
//   const result = []
//   const all = [
//     ...base.map(p => ranked(p, 1)),
//     ...top.map(p => ranked(p, 2)),
//   ].sort(byStart)
//
//   let overlappingCount = 0
//   let currentMoment = all[0].start
//
//   while (overlappingCount >= 0) {
//     console.log(overlappingCount)
//     // const nextPrevailingPeriod = all.find(({ start, rank }) => {
//     //   if (!overlappingCount) {
//     //     return start.valueOf() >= currentMoment.valueOf()
//     //   }
//     //   return start.valueOf() >= currentMoment.valueOf()
//     // }
//     // start.valueOf() >= currentMoment.valueOf()
//     // && (overlappingCount ? rank > overlappingCount : true))
//     const nextPrevailingPeriod = getNextPrevailingPeriod(all, currentMoment, overlappingCount)
//
//     if (!nextPrevailingPeriod) {
//       overlappingCount--
//       continue
//     }
//
//     const lastInResult = last(result)
//     if (lastInResult && (nextPrevailingPeriod.start.isSame(lastInResult.start) || nextPrevailingPeriod.start.isBetween(lastInResult.start, lastInResult.end))) {
//       // lastInResult.end = moment(Math.min(nextPrevailingPeriod.start, lastInResult.end))
//       lastInResult.end = nextPrevailingPeriod.start
//       result.push({
//         rank: nextPrevailingPeriod.rank,
//         start: nextPrevailingPeriod.start,
//         end: nextPrevailingPeriod.end,
//       })
//       currentMoment = nextPrevailingPeriod.end
//       overlappingCount = nextPrevailingPeriod.rank
//     } else {
//       result.push({
//         rank: nextPrevailingPeriod.rank,
//         start: nextPrevailingPeriod.start,
//         end: nextPrevailingPeriod.end,
//       })
//       overlappingCount = nextPrevailingPeriod.rank
//     }
//   }
//
//
//   return result.filter(({ rank, start, end }) => rank === 1 && !start.isSame(end)).map(({ start, end }) => ({ start, end }))
// }


// export const dsseleteOverlap = (base: Period[], top: Period[]): Period[] => {
//   const all = [
//     ...base.map(b => ranked(b, 0)),
//     ...top.map(t => ranked(t, 1)),
//   ].sort(byStart)
//
//   const result = []
//   const presentRanks = []
//   let currentMoment = 0
//
//   while (true) {
//     if (!presentRanks.length) {
//       const currentPeriod = all.find(({ start }) => start.valueOf() >= currentMoment.valueOf())
//       if (!currentPeriod) break
//       for (let i = 0; i <= currentPeriod.rank; i++) {
//         presentRanks.push(i)
//       }
//       result.push({ ...currentPeriod })
//     } else {
//       const currentRank = presentRanks[presentRanks.length - 1]
//       const currentPeriod = all.find(({ start, end, rank }) => rank === currentRank // eslint-disable-line no-loop-func
//         && start.valueOf() >= currentMoment.valueOf())
//       // if (!currentPeriod) throw new Error()
//       const overlappingPeriod = all.find(({ start, rank }) => // eslint-disable-line no-loop-func
//         start.valueOf() >= currentMoment.valueOf()
//           && rank > currentRank)
//
//       if (overlappingPeriod) {
//         for (let i = 0; i <= overlappingPeriod.rank; i++) {
//           presentRanks.push(i)
//         }
//         currentPeriod.end = overlappingPeriod.start
//         result.push({ ...overlappingPeriod })
//       } else {
//         currentMoment = currentPeriod.end
//         presentRanks.pop()
//         const rank = presentRanks[presentRanks.length - 1]
//         const followingUnderPeriods = all.filter(({ start }) => rank < currentPeriod.rank && start.valueOf() > currentMoment.valueOf())
//         const underCurrentPeriod = reduce(maxBy(({ rank }) => rank), { rank: -1 }, followingUnderPeriods)
//         if (underCurrentPeriod.rank !== -1 && currentMoment.isBetween(underCurrentPeriod.start, underCurrentPeriod.end)) {
//           result.push({
//             rank: presentRanks[presentRanks.length - 1],
//             start: currentMoment,
//           })
//         }
//         // if currentMoment is between underCurrentPeriod start and end, add nhrV's color to the list, starting at currentMoment
//
//       }
//     }
//   }
//
//   // let i = 0
//   // do {
//   //   const current = all[i]
//   //   if (!stack.length) {
//   //     stack.push(Base)
//   //     if (current instanceof Top) stack.push(Top)
//   //   } else {
//   //     start = current.end
//   //
//   //   }
//   //   const first = findFrom(all, p => p.value.start.valueOf() > start.valueOf())
//   // } while (true)
//
//   // return result.filter(a => a.rank === 0).map(a => a.period)
//   return result
//
//   // return all.reduce((result, (p, i) => {
//   //   if (!stack.length) {
//   //     stack.push(Base)
//   //     if (p instanceof Top) stack.push(Top)
//   //   }
//   //
//   //   stack.pop()
//   //
//   //
//   //   return result
//   // }), [])
// }

// slow
// what if we considered start and ends individually?
export const dseleteOverlap = (base: Period[], subtractions: Period[]): Period[] => {
  // base.sort(byStart)
  // subtractions.sort(byStart)
  //
  // let firstOverlapType
  // let firstOverlapperIndex = -1
  // const firstOverlappedIndex = base.findIndex((b) => {
  //   firstOverlapperIndex = subtractions.findIndex(s => // eslint-disable-line no-return-assign
  //     firstOverlapType = getOverlap(b, s)
  //   )
  //   return firstOverlapType
  // })
  // // Boolean(firstOverlapperIndex = subtractions.findIndex(s => getOverlap(b, s))) // eslint-disable-line no-return-assign
  //
  // if (firstOverlapType) {
  //   let result = base.slice(0, firstOverlappedIndex) // right end index??
  //   for (let i = firstOverlappedIndex; i++; ) {
  //     result.push()
  //   }

  // }

  let subtractionIndex = 0
  // iterate through bases
  // if baseEnd is not between next ?subnStart and ?-End, add period
  return base.reduce((result, period) => {
    const applicableSubtractions = findFrom(subtractions, (s, i) => {
      const overlaps = getOverlap(period, s)
      if (overlaps) subtractionIndex = i
      return overlaps
    })
    if (applicableSubtractions.length) {
      applicableSubtractions.forEach((s) => {
        subtract(period, s).forEach(p => result.push(p))
      })
    } else {
      result.push(period)
    }
    // const overlapping = subtractions.filter(subtraction => // can be terminated early if sorted
    //   getOverlap(period, subtraction))
    // if (overlapping.length) {
    //   overlapping.forEach(o => result.push(o))
    // }

    return result
  }, [])
}
