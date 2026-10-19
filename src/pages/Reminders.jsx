import { useData } from '../lib/data'
import { isUpcoming } from '../lib/utils'
import { DueCards, dueStudents } from '../components/DueList'

export default function Reminders() {
  const { students, settings, reload } = useData()
  const soon = students.filter(isUpcoming).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
  const overdue = dueStudents(students)
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reminders</h1>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">2 days left ({soon.length})</h2>
        <p className="text-sm text-slate-600">Students whose month ends in 2 days or less. Send the reminder so they can pay on time.</p>
        <DueCards list={soon} settings={settings} onChange={reload} advance empty="Nobody has 2 days or less left." />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Overdue ({overdue.length})</h2>
        <p className="text-sm text-slate-600">Fee date is today or already passed and not yet paid. Most overdue first.</p>
        <DueCards list={overdue} settings={settings} onChange={reload} empty="No overdue fees. Nice." />
      </section>
    </div>
  )
}
