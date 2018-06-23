// @flow
import type { Opening } from './openings'
import type { Period } from './periods'

export type ActivityChunk = Period

export type Schedule = {
  activityChunks: Array<ActivityChunk>,
  openings: Array<Opening>,
  potentialExtraActivityChunks: Array<ActivityChunk>,
  potentialExtraActivitySum: moment$MomentDuration,
}
