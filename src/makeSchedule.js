// @flow
import { duration } from 'moment'
import { reducePeriodFromStart, deleteOverlap } from './periods'
import maxChunkInOpening from './maxChunkInOpening'
import type { Goal } from './goals'
import type { Opening } from './openings'
import type { Period } from './periods'

export type ActivityChunk = Period

export type SingleGoalSchedule = {
  goal: Goal,
  activityChunks: Array<ActivityChunk>,
  openings: Array<Opening>,
}

export type Schedule = Array<SingleGoalSchedule>

// distributes activity blocks in free time for a given cycle
// seems maybe it makes sense to loop twice, in order to find a) possible schedule
// and b) maxed-out 'schedule' for feasibility rating
const makeSingleGoalSchedule = (goal: Goal, openings: Array<Opening>): SingleGoalSchedule => {
  const result = openings.reduce((accumulator, opening) => {
    const { activitySum, schedule } = accumulator
    if (activitySum.asMinutes() >= goal.volume.asMinutes()) {
      return accumulator
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

    return accumulator
  }, {
    activitySum: duration(0),
    schedule: {
      goal,
      activityChunks: [],
      openings: [],
    },
  })
  return result.schedule
}

type GoalsAndOpenings = Array<{ goal: Goal, openings: Opening[] }>
export default function makeSchedule(goalsAndOpenings: GoalsAndOpenings): SingleGoalSchedule[] {
  return goalsAndOpenings
    .reduce((accumulator, { goal, openings }) => {
      const { activityChunks } = accumulator
      const singleGoal = makeSingleGoalSchedule(goal, deleteOverlap(openings, activityChunks))
      const { activityChunks: newActivityChunks } = singleGoal

      accumulator.schedule.push(singleGoal)
      newActivityChunks.forEach(ac => activityChunks.push(ac))

      return accumulator
    }, {
      activityChunks: [],
      schedule: [],
    })
    .schedule
}
