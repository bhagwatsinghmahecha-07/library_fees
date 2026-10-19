import { useState } from 'react'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useData } from '../lib/data'
import { addMonths, defaultFee, libOf, seatsFor, today } from '../lib/utils'
import StudentCard from '../components/StudentCard'

const blank = () => ({ full_name: '', phone: '+91', seat_no: '', joined_on: today(), monthly_fee: '', status: 'Active', library: 'Normal', locker: false })

function Form({ initial, settings, students, onClose, onSaved }) {
  const [f, setF] = useState(initial)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  // Changing library or locker on a NEW student fills in that option's price from Settings (still editable)
  const change = (patch) => {
    const n = { ...f, ...patch }
    if (!initial.id) { const d = defaultFee(settings, n.library, n.locker); if (d !== '') n.monthly_fee = d }
    setF(n)
  }
  const editing = !!initial.id

  async function save(e) {
    e.preventDefault(); setErr('')
    const seat = Number(f.seat_no)
    const max = seatsFor(settings, f.library)
    if (seat < 1 || seat > max) return setErr(`${f.library} library has seats 1 to ${max}.`)
    if (f.status === 'Active' && students.some((x) => x.status === 'Active' && libOf(x) === f.library && x.seat_no === seat && x.id !== initial.id))
      return setErr(`${f.library} seat ${seat} already has an Active student.`)
    const row = { full_name: f.full_name.trim(), phone: f.phone.trim(), seat_no: seat, joined_on: f.joined_on, monthly_fee: Number(f.monthly_fee), status: f.status, library: f.library, locker: !!f.locker }
    try {
      // New student: first due date is 1 month after joining. Editing never changes the due date.
      if (editing) await updateDoc(doc(db, 'students', initial.id), row)
      else await addDoc(collection(db, 'students'), { ...row, next_due_date: addMonths(f.joined_on, 1), reminder_sent_on: null, created_at: serverTimestamp() })
    } catch (ex) { return setErr(ex.message) }
    onSaved()
  }
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto bg-black/50 p-4">
      <form onSubmit={save} className="card mx-auto max-w-md space-y-3">
        <h2 className="text-xl font-bold">{editing ? 'Edit student' : 'Add student'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold">Library
            <select className="input mt-1 font-normal" value={f.library} onChange={(e) => change({ library: e.target.value })}><option>Normal</option><option>Premium</option></select>
          </label>
          <label className="block text-sm font-bold">Locker
            <select className="input mt-1 font-normal" value={f.locker ? 'yes' : 'no'} onChange={(e) => change({ locker: e.target.value === 'yes' })}><option value="no">Without locker</option><option value="yes">With locker</option></select>
          </label>
        </div>
        <label className="block text-sm font-bold">Full name<input className="input mt-1 font-normal" required value={f.full_name} onChange={set('full_name')} /></label>
        <label className="block text-sm font-bold">WhatsApp number (with country code)<input className="input mt-1 font-normal" required inputMode="tel" value={f.phone} onChange={set('phone')} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold">Seat number<input className="input mt-1 font-normal" required type="number" min="1" value={f.seat_no} onChange={set('seat_no')} /></label>
          <label className="block text-sm font-bold">Monthly fee (₹)<input className="input mt-1 font-normal" required type="number" min="0" value={f.monthly_fee} onChange={set('monthly_fee')} /></label>
        </div>
        <label className="block text-sm font-bold">Date of joining<input className="input mt-1 font-normal" required type="date" value={f.joined_on} onChange={set('joined_on')} /></label>
        <label className="block text-sm font-bold">Status
          <select className="input mt-1 font-normal" value={f.status} onChange={set('status')}><option>Active</option><option>Left</option></select>
        </label>
        {err && <p className="text-sm text-red-700">{err}</p>}
        <div className="flex gap-2"><button className="btn-primary flex-1">Save student</button><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  )
}

export default function Students() {
  const { students, settings, reload } = useData()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('Active')
  const [lib, setLib] = useState('All')
  const [form, setForm] = useState(null)
  const term = q.trim().toLowerCase()
  const list = students.filter((s) =>
    (filter === 'All' || s.status === filter) && (lib === 'All' || libOf(s) === lib) &&
    (!term || s.full_name.toLowerCase().includes(term) || s.phone.replace(/\D/g, '').includes(term.replace(/\D/g, '') || '§') || String(s.seat_no) === term))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Students</h1><button className="btn-primary" onClick={() => setForm({ ...blank(), monthly_fee: defaultFee(settings, 'Normal', false) })}>Add student</button></div>
      <input className="input" type="search" placeholder="Search name, phone or seat number" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-2">{['Active', 'Left', 'All'].map((x) => <button key={x} onClick={() => setFilter(x)} className={filter === x ? 'btn-primary' : 'btn-ghost'}>{x}</button>)}</div>
      <div className="flex gap-2">{['All', 'Normal', 'Premium'].map((x) => <button key={x} onClick={() => setLib(x)} className={lib === x ? 'btn-primary' : 'btn-ghost'}>{x === 'All' ? 'Both libraries' : x}</button>)}</div>
      {list.length === 0 && <p className="card text-slate-600">No students found. Tap “Add student” to create one.</p>}
      {list.map((s) => <StudentCard key={s.id} s={s} settings={settings} onChange={reload} onEdit={(st) => setForm({ ...st, library: libOf(st), locker: !!st.locker })} />)}
      {form && <Form initial={form} settings={settings} students={students} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />}
    </div>
  )
}
