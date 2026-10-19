import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { daysLate, isUpcoming, seatsFor } from '../lib/utils'
import { DueCards, dueStudents } from '../components/DueList'

const Stat = ({ label, value, tone = '' }) => (
  <div className="card"><p className="text-3xl font-bold" style={{ color: tone || undefined }}>{value}</p><p className="text-sm text-slate-600">{label}</p></div>
)

export default function Dashboard() {
  const { students, settings, reload } = useData()
  const active = students.filter((s) => s.status === 'Active')
  const dueList = dueStudents(students)
  const dueToday = dueList.filter((s) => daysLate(s.next_due_date) === 0).length
  const overdue = dueList.length - dueToday
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{settings.owner_name ? `Hello, ${settings.owner_name}` : 'Dashboard'}</h1>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Active students" value={active.length} />
        <Stat label="Lockers in use" value={active.filter((s) => s.locker).length} />
        {['Normal', 'Premium'].map((lib) => {
          const total = seatsFor(settings, lib)
          const taken = active.filter((s) => (s.library || 'Normal') === lib).length
          return <Stat key={lib} label={`${lib} seats taken · ${Math.max(total - taken, 0)} free`} value={`${taken} / ${total}`} />
        })}
        <Stat label="Due today" value={dueToday} tone="#b45309" />
        <Stat label="Overdue" value={overdue} tone="#b91c1c" />
        <Stat label="Due in next 2 days" value={students.filter(isUpcoming).length} />
      </div>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">Fees to collect ({dueList.length})</h2>
          <Link to="/due" className="text-sm font-bold text-brand underline">Open Due list</Link>
        </div>
        <p className="mb-2 text-sm text-slate-500">This list is always here, even if the 9 AM WhatsApp alert does not arrive.</p>
        <DueCards list={dueList} settings={settings} onChange={reload} />
      </section>
    </div>
  )
}
