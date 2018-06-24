import moment from 'moment'
export const TIME_FORMAT = 'DD.MM ddd HH:mm'
export const formatPeriod = ({ start, end }: Period) =>
  `${start.format(TIME_FORMAT)} - ${end.format(TIME_FORMAT)}`

moment().constructor.prototype.toISOString = function toISOString() {
  return this.format(TIME_FORMAT)
}

const counts = {}
export const loopsie = (message = '') => {
  counts[message] = counts[message] || 0
  counts[message] += 1
  if (counts[message] > 542) throw new Error('loopsie! -- ' + message)
}
