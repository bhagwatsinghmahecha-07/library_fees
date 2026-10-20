import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { isUpcoming, rupees } from '../lib/utils'
import { DueCards, dueStudents } from '../components/DueList'
import Sheet from '../components/Sheet'

const Stat = ({ label, value, tone, onClick }) => (
  <button type="button" onClick={onClick} className="card w-full text-left active:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
    <p className="text-3xl font-bold" style={{ color: tone || undefined }}>{value}</p>
    <p className="text-sm text-slate-600">{label}</p>
  </button>
)

export default function Dashboard() {
  const { students, settings, reload } = useData()
  const [open, setOpen] = useState(null) // 'active' | 'free' | 'soon' | 'overdue'
  const active = students.filter((s) => s.status === 'Active')
  const dueList = dueStudents(students)
  const soon = students.filter(isUpcoming).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
  const total = Number(settings.total_seats)
  const taken = new Set(active.map((s) => s.seat_no))
  const freeSeats = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !taken.has(n))
  const close = () => setOpen(null)

  let sheet = null
  if (open === 'active') {
    sheet = (
      <Sheet title="Active students" onClose={close}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="card text-center"><p className="text-2xl font-bold">{active.length} / {total}</p><p className="text-xs text-slate-600">Seats booked</p></div>
            <div className="card text-center"><p className="text-2xl font-bold">{freeSeats.length}</p><p className="text-xs text-slate-600">Seats free</p></div>
          </div>
          <section className="card">
            {active.length === 0 ? <p className="text-sm text-slate-500">No active students yet.</p> : (
              <ul className="divide-y divide-slate-200 text-sm">
                {[...active].sort((a, b) => a.seat_no - b.seat_no).map((s) => <li key={s.id} className="flex justify-between gap-2 py-1.5"><span>Seat {s.seat_no} · {s.full_name}</span><span>{rupees(s.monthly_fee)}</span></li>)}
              </ul>
            )}
          </section>
        </div>
      </Sheet>
    )
  } else if (open === 'free') {
    sheet = (
      <Sheet title={`Free seats (${freeSeats.length} of ${total})`} onClose={close}>
        {freeSeats.length === 0 ? <p className="card text-slate-600">All seats are booked.</p> : (
          <div className="flex flex-wrap gap-2">{freeSeats.map((n) => <span key={n} className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold ring-1 ring-slate-300">{n}</span>)}</div>
        )}
      </Sheet>
    )
  } else if (open === 'overdue') {
    sheet = <Sheet title={`Overdue (${dueList.length})`} onClose={close}><p className="mb-3 text-sm text-slate-600">Includes fees due today.</p><DueCards list={dueList} settings={settings} onChange={reload} empty="No overdue fees." /></Sheet>
  } else if (open === 'soon') {
    sheet = <Sheet title={`2 days left (${soon.length})`} onClose={close}><DueCards list={soon} settings={settings} onChange={reload} advance empty="Nobody has 2 days or less left." /></Sheet>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{settings.library_name || 'Dashboard'}</h1>
        {settings.owner_name && <p className="text-slate-600">Hello, {settings.owner_name}</p>}
        {!settings.library_name && <p className="text-sm text-slate-500">Add your library name in <Link to="/settings" className="font-bold text-brand underline">Settings</Link>.</p>}
      </div>
      <p className="-mt-2 text-sm text-slate-500">Tap any number for details.</p>
      <div className="grid grid-cols-2 gap-3">
        <Stat label={`Active students · ${total} seats`} value={active.length} onClick={() => setOpen('active')} />
        <Stat label="Free seats" value={freeSeats.length} onClick={() => setOpen('free')} />
        <Stat label="2 days left" value={soon.length} onClick={() => setOpen('soon')} />
        <Stat label="Overdue" value={dueList.length} tone="#b91c1c" onClick={() => setOpen('overdue')} />
      </div>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">Overdue fees ({dueList.length})</h2>
          <Link to="/reminders" className="text-sm font-bold text-brand underline">Open Reminders</Link>
        </div>
        <p className="mb-2 text-sm text-slate-500">Includes fees due today. This list is always here, even if the 9 AM WhatsApp alert does not arrive.</p>
        <DueCards list={dueList} settings={settings} onChange={reload} />
      </section>
      {sheet}
    </div>
  )
}
