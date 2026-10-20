import { useData } from '../lib/data'
import { isDue, planOf, timing } from '../lib/utils'

export default function Seats() {
  const { students, settings } = useData()
  const bySeat = {}
  students.filter((s) => s.status === 'Active').forEach((s) => { (bySeat[s.seat_no] ||= []).push(s) })
  const total = Number(settings.total_seats)
  const seats = Array.from({ length: total }, (_, i) => i + 1)
  const inUse = seats.filter((n) => bySeat[n]).length
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Seats</h1>
      <p className="text-sm text-slate-600">{inUse} seats in use, {total - inUse} free. Green = taken, red outline = fee due, grey = empty. A half-time seat can hold a second student at a different time. Change the number of seats in Settings.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {seats.map((n) => {
          const list = bySeat[n] || []
          const tone = !list.length ? 'bg-white text-slate-400 ring-slate-200' : list.some(isDue) ? 'bg-teal-50 ring-2 ring-red-400' : 'bg-teal-50 ring-teal-300'
          return (
            <div key={n} className={`rounded-lg p-2 text-sm ring-1 ${tone}`}>
              <p className="font-bold">{n}</p>
              {!list.length ? <p>Empty</p> : list.map((s) => (
                <p key={s.id} className="text-xs"><span className="font-bold">{s.full_name}</span>{planOf(s) === 'Half' ? ` · ${timing(s)}` : ' · Full time'}</p>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
