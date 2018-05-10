// @flow
import moment, { duration } from 'moment'

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
