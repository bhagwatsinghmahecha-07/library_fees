import { useData } from '../lib/data'
import { isDue } from '../lib/utils'

export default function Seats() {
  const { students, settings } = useData()
  const active = students.filter((s) => s.status === 'Active')
  const bySeat = Object.fromEntries(active.map((s) => [s.seat_no, s]))
  const total = Number(settings.total_seats)
  const seats = Array.from({ length: total }, (_, i) => i + 1)
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Seats</h1>
      <p className="text-sm text-slate-600">{active.length} taken, {Math.max(total - active.length, 0)} free. Green = taken, red outline = fee due, grey = empty. Change the number of seats in Settings.</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {seats.map((n) => {
          const s = bySeat[n]
          return (
            <div key={n} className={`rounded-lg p-2 text-sm ring-1 ${s ? (isDue(s) ? 'bg-teal-50 ring-2 ring-red-400' : 'bg-teal-50 ring-teal-300') : 'bg-white text-slate-400 ring-slate-200'}`}>
              <p className="font-bold">{n}</p>
              <p className="truncate">{s ? s.full_name : 'Empty'}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
