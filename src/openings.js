// @flow
import moment from 'moment'
import { partition, maxBy, minBy, reduce, prop, pipe, sortBy } from 'ramda'
import { NEVER } from './period'
import type { Period } from './period'

export type Opening = Period

export const opening = (startArg: *, endArg: *): Opening => ({
  start: moment(startArg),
  end: moment(endArg),
})

export const isAdjacent = (opening1: Opening, opening2: Opening) =>
  opening1.end.isSame(opening2.start)
  || opening1.start.isSame(opening2.end)

const minStart = openings => reduce(minBy(prop('start')), NEVER, openings).start
const maxEnd = openings => reduce(maxBy(prop('end')), NEVER, openings).end
export const consolidateOpenings : (Opening[]) => Opening[] = pipe(
  reduce((combined, currentOpening) => {
    const [adjacent, nonAdjacent] = partition(o => isAdjacent(currentOpening, o), combined)

    if (!adjacent.length) {
      return [currentOpening, ...combined]
    }

    const adjacentWithOpening = [currentOpening, ...adjacent]
    return [...nonAdjacent, {
      start: minStart(adjacentWithOpening),
      end: maxEnd(adjacentWithOpening),
    }]
  }, []),
  sortBy(prop('start')),
)

export const getVolume = ({ start, end }: Opening): moment$MomentDuration =>
  moment.duration(end.diff(start))
