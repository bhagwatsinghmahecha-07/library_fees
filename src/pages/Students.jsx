import { useState } from 'react'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useData } from '../lib/data'
import { addMonths, today } from '../lib/utils'
import StudentCard from '../components/StudentCard'
import Sheet from '../components/Sheet'

const blank = (fee) => ({ full_name: '', phone: '+91', seat_no: '', joined_on: today(), monthly_fee: fee ?? '', status: 'Active' })

function Form({ initial, settings, students, onClose, onSaved }) {
  const [f, setF] = useState(initial)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = !!initial.id
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault(); setErr('')
    const seat = Number(f.seat_no)
    const max = Number(settings.total_seats)
    if (seat < 1 || seat > max) return setErr(`Seat must be between 1 and ${max}. You can change the number of seats in Settings.`)
    if (f.status === 'Active' && students.some((x) => x.status === 'Active' && x.seat_no === seat && x.id !== initial.id))
      return setErr(`Seat ${seat} already has an Active student.`)
    const row = { full_name: f.full_name.trim(), phone: f.phone.trim(), seat_no: seat, joined_on: f.joined_on, monthly_fee: Number(f.monthly_fee), status: f.status }
    setBusy(true)
    try {
      // New student: first due date is 1 month after joining. Editing never changes the due date.
      if (editing) await updateDoc(doc(db, 'students', initial.id), row)
      else await addDoc(collection(db, 'students'), { ...row, next_due_date: addMonths(f.joined_on, 1), reminder_sent_on: null, created_at: serverTimestamp() })
      onSaved()
    } catch (ex) { setErr(ex.message); setBusy(false) }
  }
  return (
    <Sheet title={editing ? 'Edit student' : 'Add student'} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <label className="block text-sm font-bold">Full name<input className="input mt-1 font-normal" required value={f.full_name} onChange={set('full_name')} /></label>
        <label className="block text-sm font-bold">WhatsApp number (with country code)<input className="input mt-1 font-normal" required inputMode="tel" value={f.phone} onChange={set('phone')} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold">Seat number<input className="input mt-1 font-normal" required type="number" inputMode="numeric" min="1" value={f.seat_no} onChange={set('seat_no')} /></label>
          <label className="block text-sm font-bold">Monthly fee (₹)<input className="input mt-1 font-normal" required type="number" inputMode="decimal" min="0" value={f.monthly_fee} onChange={set('monthly_fee')} /></label>
        </div>
        <label className="block text-sm font-bold">Date of joining<input className="input mt-1 font-normal" required type="date" value={f.joined_on} onChange={set('joined_on')} /></label>
        <label className="block text-sm font-bold">Status
          <select className="input mt-1 font-normal" value={f.status} onChange={set('status')}><option>Active</option><option>Left</option></select>
        </label>
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save student'}</button>
      </form>
    </Sheet>
  )
}

export default function Students() {
  const { students, settings, reload } = useData()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('Active')
  const [form, setForm] = useState(null)
  const term = q.trim().toLowerCase()
  const digits = term.replace(/\D/g, '')
  const list = students
    .filter((s) => (filter === 'All' || s.status === filter) &&
      (!term || s.full_name.toLowerCase().includes(term) || (digits && s.phone.replace(/\D/g, '').includes(digits)) || String(s.seat_no) === term))
    .sort((a, b) => a.seat_no - b.seat_no)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Students</h1><button className="btn-primary" onClick={() => setForm(blank(settings.default_fee))}>Add student</button></div>
      <input className="input" type="search" placeholder="Search name, phone or seat number" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-2">{['Active', 'Left', 'All'].map((x) => <button key={x} onClick={() => setFilter(x)} className={filter === x ? 'btn-primary' : 'btn-ghost'}>{x}</button>)}</div>
      {list.length === 0 && <p className="card text-slate-600">No students found. Tap “Add student” to create one.</p>}
      <div className="space-y-3">
        {list.map((s) => <StudentCard key={s.id} s={s} settings={settings} onChange={reload} onEdit={(st) => setForm({ ...st })} />)}
      </div>
      {form && <Form initial={form} settings={settings} students={students} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />}
    </div>
  )
}
