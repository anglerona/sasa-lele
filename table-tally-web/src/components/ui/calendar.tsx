import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import { addMonths, format, isSameDay, isSameMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isBefore, isAfter } from "date-fns"

function getWeeksInMonth(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const weeks = []
  let current = start
  while (current <= end) {
    weeks.push(current)
    current = addDays(current, 7)
  }
  return weeks
}

export function Calendar({
  selected,
  onSelect,
  fromDate,
  toDate,
  mode = "single",
  initialFocus = false,
}: {
  selected?: Date
  onSelect: (date: Date) => void
  fromDate?: Date
  toDate?: Date
  mode?: "single"
  initialFocus?: boolean
}) {
  const [month, setMonth] = React.useState(selected || new Date())
  const weeks = getWeeksInMonth(month)
  function isDisabled(date: Date) {
    if (fromDate && isBefore(date, fromDate)) return true
    if (toDate && isAfter(date, toDate)) return true
    return false
  }
  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="p-1 rounded hover:bg-accent"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <ChevronLeftIcon />
        </button>
        <span className="font-semibold">
          {format(month, "MMMM yyyy")}
        </span>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent"
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div className="grid grid-cols-7 text-xs mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-muted-foreground">{d}</div>
        ))}
      </div>
      {weeks.map((weekStart, i) => (
        <div className="grid grid-cols-7" key={i}>
          {Array.from({ length: 7 }).map((_, d) => {
            const day = addDays(weekStart, d)
            const isCurrentMonth = isSameMonth(day, month)
            const isSelected = selected && isSameDay(day, selected)
            return (
              <button
                key={d}
                type="button"
                className={
                  "aspect-square w-8 rounded text-sm mx-auto flex items-center justify-center " +
                  (!isCurrentMonth ? "text-muted-foreground" : "") +
                  (isSelected ? " bg-primary text-primary-foreground" : " hover:bg-accent") +
                  (isDisabled(day) ? " opacity-40 pointer-events-none" : "")
                }
                onClick={() => onSelect(day)}
                tabIndex={initialFocus && i === 0 && d === 0 ? 0 : -1}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
