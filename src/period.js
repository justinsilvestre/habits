// @flow
import moment from 'moment'

export type Period = {|
  start: moment$Moment,
  end: moment$Moment,
|}

export const NEVER: Period = { // eslint-disable-line import/prefer-default-export
  start: moment(8640000000000000),
  end: moment(-8640000000000000),
}
