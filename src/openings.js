// @flow
import moment from 'moment'
import { partition, maxBy, minBy, reduce, curry, prop, pipe, sortBy } from 'ramda'
import type { Period } from './period'

export type Opening = Period

const NEVER = { start: Infinity, end: -Infinity }

export const opening = (startArg: *, endArg: *): Opening => ({
  start: moment(startArg),
  end: moment(endArg),
})

export const isAdjacent = curry((opening1, opening2) =>
  opening1.end.isSame(opening2.start)
  || opening1.start.isSame(opening2.end)
)

const minStart = (openings) => reduce(minBy(prop('start')), NEVER, openings).start
const maxEnd = (openings) => reduce(maxBy(prop('end')), NEVER, openings).end
export const consolidateOpenings : (Opening[]) => Opening[] = pipe(
  reduce((combined, opening) => {
    const [adjacent, nonAdjacent] = partition(isAdjacent(opening), combined)

    if (!adjacent.length) {
      return [opening, ...combined]
    }

    const adjacentWithOpening = [opening, ...adjacent]
    return [...nonAdjacent, {
      start: minStart(adjacentWithOpening),
      end: maxEnd(adjacentWithOpening),
    }]
  }, []),
  sortBy(prop('start'))
)

export const getVolume = ({ start, end }: Opening): moment$MomentDuration => moment.duration(end.diff(start))
