import { useData } from '../lib/data'
import { isUpcoming } from '../lib/utils'
import { DueCards, dueStudents } from '../components/DueList'

export default function Due() {
  const { students, settings, reload } = useData()
  const list = dueStudents(students)
  const upcoming = students.filter(isUpcoming).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Due list</h1>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Due today or overdue ({list.length})</h2>
        <p className="text-sm text-slate-600">Most overdue first. Tap “Send WhatsApp” to open a ready message.</p>
        <DueCards list={list} settings={settings} onChange={reload} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Coming up in the next 2 days ({upcoming.length})</h2>
        <p className="text-sm text-slate-600">Send an advance reminder so the student can pay on time.</p>
        <DueCards list={upcoming} settings={settings} onChange={reload} advance empty="No fees fall due in the next 2 days." />
      </section>
    </div>
  )
}
