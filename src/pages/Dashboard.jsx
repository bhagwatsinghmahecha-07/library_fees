import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { isUpcoming, libOf, seatsFor } from '../lib/utils'
import { DueCards, dueStudents } from '../components/DueList'
import Sheet from '../components/Sheet'
import LibraryBreakdown from '../components/LibraryBreakdown'

const Stat = ({ label, value, tone, onClick }) => (
  <button type="button" onClick={onClick} className="card w-full text-left active:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
    <p className="text-3xl font-bold" style={{ color: tone || undefined }}>{value}</p>
    <p className="text-sm text-slate-600">{label}</p>
  </button>
)

export default function Dashboard() {
  const { students, settings, reload } = useData()
  const [open, setOpen] = useState(null) // { type, lib? }
  const active = students.filter((s) => s.status === 'Active')
  const dueList = dueStudents(students)
  const soon = students.filter(isUpcoming).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
  const inLib = (lib) => active.filter((s) => libOf(s) === lib)
  const close = () => setOpen(null)

  const libStat = (lib) => {
    const total = seatsFor(settings, lib), taken = inLib(lib).length
    return <Stat key={lib} label={`${lib} seats taken · ${Math.max(total - taken, 0)} free`} value={`${taken} / ${total}`} onClick={() => setOpen({ type: 'seats', lib })} />
  }
  const LibButton = ({ lib }) => (
    <button type="button" onClick={() => setOpen({ type: 'active', lib })} className="card w-full text-left active:bg-slate-50">
      <p className="text-lg font-bold">{lib} library</p>
      <p className="text-sm text-slate-600">{inLib(lib).length} active students</p>
    </button>
  )

  let sheet = null
  if (open?.type === 'active') {
    sheet = (
      <Sheet title={open.lib ? `${open.lib} library` : 'Active students'} onClose={close}>
        {open.lib ? (
          <div className="space-y-3">
            <button type="button" className="btn-ghost" onClick={() => setOpen({ type: 'active' })}>Back</button>
            <LibraryBreakdown lib={open.lib} students={students} settings={settings} />
          </div>
        ) : (
          <div className="space-y-3"><p className="text-sm text-slate-600">Choose a library to see seats booked.</p><LibButton lib="Normal" /><LibButton lib="Premium" /></div>
        )}
      </Sheet>
    )
  } else if (open?.type === 'seats') {
    sheet = <Sheet title={`${open.lib} library`} onClose={close}><LibraryBreakdown lib={open.lib} students={students} settings={settings} /></Sheet>
  } else if (open?.type === 'lockers') {
    sheet = (
      <Sheet title="Lockers in use" onClose={close}>
        <div className="space-y-4">
          {['Normal', 'Premium'].map((lib) => {
            const list = inLib(lib).filter((s) => s.locker).sort((a, b) => a.seat_no - b.seat_no)
            return (
              <section key={lib} className="card">
                <h3 className="font-bold">{lib} library · {list.length} with locker</h3>
                {list.length === 0 ? <p className="mt-1 text-sm text-slate-500">No lockers in use.</p> : <ul className="mt-2 divide-y divide-slate-200 text-sm">{list.map((s) => <li key={s.id} className="py-1.5">Seat {s.seat_no} · {s.full_name}</li>)}</ul>}
              </section>
            )
          })}
        </div>
      </Sheet>
    )
  } else if (open) {
    const cfg = { overdue: ['Overdue (including due today)', dueList, false, 'No overdue fees.'], soon: ['2 days left', soon, true, 'Nobody has 2 days or less left.'] }[open.type]
    sheet = <Sheet title={`${cfg[0]} (${cfg[1].length})`} onClose={close}><DueCards list={cfg[1]} settings={settings} onChange={reload} advance={cfg[2]} empty={cfg[3]} /></Sheet>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{settings.owner_name ? `Hello, ${settings.owner_name}` : 'Dashboard'}</h1>
      <p className="-mt-2 text-sm text-slate-500">Tap any number for details.</p>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Active students" value={active.length} onClick={() => setOpen({ type: 'active' })} />
        <Stat label="Lockers in use" value={active.filter((s) => s.locker).length} onClick={() => setOpen({ type: 'lockers' })} />
        {['Normal', 'Premium'].map(libStat)}
        <Stat label="2 days left" value={soon.length} onClick={() => setOpen({ type: 'soon' })} />
        <Stat label="Overdue" value={dueList.length} tone="#b91c1c" onClick={() => setOpen({ type: 'overdue' })} />
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
