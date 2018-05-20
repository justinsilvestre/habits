// @flow
import { duration } from 'moment'
import { map } from 'ramda'
import { reducePeriodFromStart, deleteOverlap } from './periods'
import maxChunkInOpening from './maxChunkInOpening'
import type { Goal } from './goals'
import type { Opening } from './openings'
import type { Period } from './periods'

export type ActivityChunk = Period

export type SingleGoalSchedule = {|
  activityChunks: Array<ActivityChunk>,
  openings: Array<Opening>,
|}

export type Schedule = Array<SingleGoalSchedule>

// distributes activity blocks in free time for a given cycle
// seems maybe it makes sense to loop twice, in order to find a) possible schedule
// and b) maxed-out 'schedule' for feasibility rating
const makeSingleGoalSchedule = (goal: Goal, openings: Array<Opening>): SingleGoalSchedule => {
  const result = openings.reduce((accumulator, opening) => {
    const { activitySum, schedule } = accumulator
    if (activitySum.asMilliseconds() >= goal.volume.asMilliseconds()) {
      schedule.openings.push(opening)

      return accumulator
    }

    const { activityChunks, openings: newOpenings } = schedule
    const maxActivityChunkDuration = maxChunkInOpening(goal, opening)
    if (maxActivityChunkDuration) {
      activityChunks.push({
        start: opening.start,
        end: opening.start.clone().add(maxActivityChunkDuration),
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
      activityChunks: [],
      openings: [],
    },
  })

  const { activitySum, schedule } = result

  if (activitySum.asMilliseconds() < goal.volume.asMilliseconds()) {
    throw new Error(`Not enough time for goal "${goal.name}"`)
  }

  return schedule
}

const descendingByMaxChunk = ({ chunking: { max: a } }, { chunking: { max: b } }) => {
  if (a.asMilliseconds() > b.asMilliseconds()) return -1
  if (a.asMilliseconds() < b.asMilliseconds()) return 1
  return 0
}

export default function makeSchedule(goals: Array<Goal>): { [string]: SingleGoalSchedule } {
  const withIntermediaryOpenings = goals
    .sort(descendingByMaxChunk)
    .reduce((accumulator, goal) => {
      const { activityChunks } = accumulator
      const singleGoal = makeSingleGoalSchedule(goal, deleteOverlap(goal.openings, activityChunks))
      const { activityChunks: newActivityChunks } = singleGoal

      accumulator.schedule[goal.id] = singleGoal // eslint-disable-line no-param-reassign
      newActivityChunks.forEach(ac => activityChunks.push(ac))

      return accumulator
    }, {
      activityChunks: [],
      schedule: {},
    })


  const schedule = map((singleGoalSchedule) => {
    singleGoalSchedule.openings = // eslint-disable-line no-param-reassign
      deleteOverlap(singleGoalSchedule.openings, withIntermediaryOpenings.activityChunks)
    return singleGoalSchedule
  }, withIntermediaryOpenings.schedule)

  return schedule
}
