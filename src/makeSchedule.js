// @flow
import { duration } from 'moment'
import { reducePeriodFromStart } from './period'
import maxChunkInOpening from './maxChunkInOpening'
import type { Goal } from './goals'
import type { Opening } from './openings'
import type { Period } from './period'

export type ActivityChunk = Period

export type Schedule = {
  activityChunks: Array<ActivityChunk>,
  openings: Array<Opening>,
}

// distributes activity blocks in free time for a given cycle
// seems maybe it makes sense to loop twice, in order to find a) possible schedule
// and b) maxed-out 'schedule' for feasibility rating
const makeSingleGoalSchedule = (goal: Goal, openings: Array<Opening>): Schedule => {
  const result = openings.reduce(({ activitySum, schedule }, opening) => {
    if (activitySum.asMinutes() >= goal.volume.asMinutes()) {
      return { activitySum, schedule }
    }

    const { activityChunks, openings: newOpenings } = schedule
    const maxActivityChunkDuration = maxChunkInOpening(goal, opening)
    if (maxActivityChunkDuration) {
      activityChunks.push({
        start: opening.start,
        end: opening.end.clone().add(maxActivityChunkDuration),
      })
      activitySum.add(maxActivityChunkDuration)
    }
    const newOpening = maxActivityChunkDuration
      ? reducePeriodFromStart(maxActivityChunkDuration, opening)
      : opening
    if (newOpening) {
      newOpenings.push(newOpening)
    }

    return { activitySum, schedule }
  }, {
    activitySum: duration(0),
    schedule: {
      activityChunks: [],
      openings: [],
    },
  })
  return result.schedule
}

export default function makeSchedule(goalsAndOpenings: Array<{ goal: Goal, opening: Opening }>) {

}
