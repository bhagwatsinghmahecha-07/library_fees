import { libOf, rupees, seatsFor } from '../lib/utils'

const Box = ({ label, value }) => <div className="card text-center"><p className="text-2xl font-bold">{value}</p><p className="text-xs text-slate-600">{label}</p></div>

// For one library: seats booked / free, then students split into With locker / Without locker
export default function LibraryBreakdown({ lib, students, settings }) {
  const act = students.filter((s) => s.status === 'Active' && libOf(s) === lib)
  const total = seatsFor(settings, lib)
  const groups = [['With locker', act.filter((s) => s.locker)], ['Without locker', act.filter((s) => !s.locker)]]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Box label="Seats booked" value={`${act.length} / ${total}`} />
        <Box label="Seats free" value={Math.max(total - act.length, 0)} />
        <Box label="With locker" value={groups[0][1].length} />
      </div>
      {groups.map(([label, list]) => (
        <section key={label} className="card">
          <h3 className="font-bold">{label} ({list.length})</h3>
          {list.length === 0 ? <p className="mt-1 text-sm text-slate-500">No students.</p> : (
            <ul className="mt-2 divide-y divide-slate-200 text-sm">
              {[...list].sort((a, b) => a.seat_no - b.seat_no).map((s) => (
                <li key={s.id} className="flex justify-between gap-2 py-1.5"><span>Seat {s.seat_no} · {s.full_name}</span><span>{rupees(s.monthly_fee)}</span></li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
