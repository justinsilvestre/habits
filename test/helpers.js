const TIME_FORMAT = 'M-D H:mm'
export const formatPeriod = ({ start, end }: Period) =>
  `${start.format(TIME_FORMAT)} - ${end.format(TIME_FORMAT)}`
