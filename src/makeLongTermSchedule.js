// @flow
import makeSchedule from './makeSchedule'
import { deleteOverlap } from './periods'
import type { Goal } from './goals'
import type { Period } from './periods'
import type { Opening } from './openings'
import type { Schedule } from './schedules'

type IsoWeekday =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
type OpeningsByWeekday = { [string]: Array<Opening> }
const WEEKDAYS : Array<IsoWeekday> = ['1', '2', '3', '4', '5', '6', '7']
const byWeekday = (openings: Array<Opening>): OpeningsByWeekday =>
  WEEKDAYS.reduce((result, isoWeekdayString) => {
    result[isoWeekdayString] = openings.filter(o => // eslint-disable-line no-param-reassign
      o.start.isoWeekday() === Number(isoWeekdayString))
    return result
  }, {})

type DateRange = { startDate: moment$Moment, endDate: moment$Moment }
export const extendWeeklyOpenings = (
  { startDate, endDate }: DateRange,
  weeklyOpenings: Array<Opening>,
): Array<Opening> => {
  const currentDate = startDate.clone()
  const openingsByWeekday : OpeningsByWeekday = byWeekday(weeklyOpenings)
  const result = []

  while (currentDate.isSameOrBefore(endDate, 'date')) {
    const dayOfWeek = String(currentDate.isoWeekday())
    const newOpenings = (openingsByWeekday[dayOfWeek] || [])

    for (const { start, end } of newOpenings) { // eslint-disable-line no-restricted-syntax
      const duration = end.diff(start)
      const newStart = start.clone().set({
        Y: currentDate.year(),
        M: currentDate.month(),
        D: currentDate.date(),
      })

      result.push({
        start: newStart,
        end: newStart.clone().add(duration),
      })
    }

    currentDate.add(1, 'day')
  }
  return result
}

const getLongTermOpenings = (
  weeklyOpeningsGoal: Goal,
  interruptions: Array<Period>,
): Array<Opening> => {
  const { openings: weeklyOpenings } = weeklyOpeningsGoal
  const extendedOpenings = extendWeeklyOpenings(weeklyOpeningsGoal, weeklyOpenings)
  return deleteOverlap(extendedOpenings, interruptions)
}

const makeLongTermSchedule = (
  goals: Array<Goal>,
  interruptions: Array<Period>,
): { [string]: Schedule } => {
  const withoutInvalidOpenings: Array<Goal> = goals.map(g => ({
    ...g,
    openings: getLongTermOpenings(g, interruptions),
  }))
  return makeSchedule(withoutInvalidOpenings)
}

export default makeLongTermSchedule
