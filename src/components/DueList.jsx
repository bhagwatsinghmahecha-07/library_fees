import { daysLate, isDue } from '../lib/utils'
import StudentCard from './StudentCard'

// Shared by Dashboard (fallback list) and the Due page
export function dueStudents(students) {
  return students.filter(isDue).sort((a, b) => daysLate(b.next_due_date) - daysLate(a.next_due_date))
}
export function DueCards({ list, onChange, settings, advance = false, empty = 'No fees are due today. Nice.' }) {
  if (!list.length) return <p className="card text-slate-600">{empty}</p>
  return <div className="space-y-3">{list.map((s) => <StudentCard key={s.id} s={s} settings={settings} onChange={onChange} advance={advance} />)}</div>
}
