import { useState } from 'react'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useData } from '../lib/data'
import { addMonths, planOf, seatConflict, today } from '../lib/utils'
import StudentCard from '../components/StudentCard'
import Sheet from '../components/Sheet'

const blank = (s) => ({ full_name: '', phone: '+91', seat_no: '', joined_on: today(), monthly_fee: s.fee_full ?? '', status: 'Active', plan: 'Full', time_from: s.half_from, time_to: s.half_to })

const Seg = ({ options, value, onChange }) => (
  <div className="mt-1 grid grid-cols-2 gap-2">
    {options.map(([v, label]) => <button type="button" key={v} aria-pressed={value === v} onClick={() => onChange(v)} className={value === v ? 'btn-primary' : 'btn-ghost'}>{label}</button>)}
  </div>
)

function Form({ initial, settings, students, onClose, onSaved }) {
  const [f, setF] = useState(initial)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = !!initial.id
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  // Choosing a plan on a NEW student fills in that plan's fee from Settings (still editable)
  const choosePlan = (plan) => {
    const n = { ...f, plan }
    const fee = plan === 'Half' ? settings.fee_half : settings.fee_full
    if (!editing && fee !== '' && fee != null) n.monthly_fee = fee
    setF(n)
  }

  async function save(e) {
    e.preventDefault(); setErr('')
    const seat = Number(f.seat_no)
    const max = Number(settings.total_seats)
    if (seat < 1 || seat > max) return setErr(`Seat must be between 1 and ${max}. You can change the number of seats in Settings.`)
    if (f.plan === 'Half') {
      if (!f.time_from || !f.time_to) return setErr('Choose the From and To time.')
      if (f.time_to <= f.time_from) return setErr('The To time must be after the From time.')
    }
    if (f.status === 'Active') {
      const others = students.filter((x) => x.status === 'Active' && x.seat_no === seat && x.id !== initial.id)
      const clash = seatConflict(f, others)
      if (clash) return setErr(clash)
    }
    const row = {
      full_name: f.full_name.trim(), phone: f.phone.trim(), seat_no: seat, joined_on: f.joined_on, monthly_fee: Number(f.monthly_fee), status: f.status,
      plan: f.plan, time_from: f.plan === 'Half' ? f.time_from : null, time_to: f.plan === 'Half' ? f.time_to : null
    }
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
        <div className="text-sm font-bold">Plan<Seg options={[['Full', 'Full time'], ['Half', 'Half time']]} value={f.plan} onChange={choosePlan} /></div>
        {f.plan === 'Half' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold">From<input className="input mt-1 font-normal" type="time" required value={f.time_from || ''} onChange={set('time_from')} /></label>
            <label className="block text-sm font-bold">To<input className="input mt-1 font-normal" type="time" required value={f.time_to || ''} onChange={set('time_to')} /></label>
          </div>
        )}
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
  const [plan, setPlan] = useState('All')
  const [form, setForm] = useState(null)
  const term = q.trim().toLowerCase()
  const digits = term.replace(/\D/g, '')
  const list = students
    .filter((s) => (filter === 'All' || s.status === filter) && (plan === 'All' || planOf(s) === plan) &&
      (!term || s.full_name.toLowerCase().includes(term) || (digits && s.phone.replace(/\D/g, '').includes(digits)) || String(s.seat_no) === term))
    .sort((a, b) => a.seat_no - b.seat_no || String(a.time_from).localeCompare(String(b.time_from)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Students</h1><button className="btn-primary" onClick={() => setForm(blank(settings))}>Add student</button></div>
      <input className="input" type="search" placeholder="Search name, phone or seat number" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        {['Active', 'Left', 'All'].map((x) => <button key={x} onClick={() => setFilter(x)} className={filter === x ? 'btn-primary' : 'btn-ghost'}>{x}</button>)}
        <span className="w-2" />
        {[['All', 'All plans'], ['Full', 'Full time'], ['Half', 'Half time']].map(([v, l]) => <button key={v} onClick={() => setPlan(v)} className={plan === v ? 'btn-primary' : 'btn-ghost'}>{l}</button>)}
      </div>
      {list.length === 0 && <p className="card text-slate-600">No students found. Tap “Add student” to create one.</p>}
      <div className="space-y-3">
        {list.map((s) => <StudentCard key={s.id} s={s} settings={settings} onChange={reload} onEdit={(st) => setForm({ ...st, plan: planOf(st), time_from: st.time_from || settings.half_from, time_to: st.time_to || settings.half_to })} />)}
      </div>
      {form && <Form initial={form} settings={settings} students={students} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />}
    </div>
  )
}
