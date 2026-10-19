import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, runTransaction, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { addMonths, daysLate, fillMessage, fmtDate, isDue, rupees, tag, today, waLink } from '../lib/utils'

export default function StudentCard({ s, settings, onChange, onEdit, advance = false }) {
  const [history, setHistory] = useState(null)
  const late = daysLate(s.next_due_date)
  const due = isDue(s)

  async function markPaid() {
    const input = window.prompt(`Amount received from ${s.full_name} (₹)`, s.monthly_fee)
    if (input === null) return
    const amount = Number(input)
    if (!(amount >= 0) || input.trim() === '') return alert('Enter a valid amount.')
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'students', s.id)
        const snap = await tx.get(ref)
        tx.set(doc(collection(db, 'students', s.id, 'payments')), { paid_on: today(), amount, created_at: serverTimestamp() })
        tx.update(ref, { next_due_date: addMonths(snap.data().next_due_date, 1), reminder_sent_on: null })
      })
    } catch (e) { return alert(e.message) }
    setHistory(null); onChange()
  }
  async function sendWhatsApp() {
    window.open(waLink(s.phone, fillMessage(settings.reminder_message, s, settings.owner_name)), '_blank')
    await updateDoc(doc(db, 'students', s.id), { reminder_sent_on: today() })
    onChange()
  }
  async function sendAdvance() {
    window.open(waLink(s.phone, fillMessage(settings.advance_message, s, settings.owner_name)), '_blank')
    await updateDoc(doc(db, 'students', s.id), { advance_sent_on: today(), advance_sent_for: s.next_due_date })
    onChange()
  }
  async function toggleHistory() {
    if (history) return setHistory(null)
    const snap = await getDocs(query(collection(db, 'students', s.id, 'payments'), orderBy('paid_on', 'desc')))
    setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }
  async function remove() {
    if (!window.confirm(`Delete ${s.full_name} and all payment history? This cannot be undone. (Use status "Left" to keep records.)`)) return
    try {
      const pays = await getDocs(collection(db, 'students', s.id, 'payments'))
      const batch = writeBatch(db)
      pays.docs.forEach((p) => batch.delete(p.ref))
      batch.delete(doc(db, 'students', s.id))
      await batch.commit()
    } catch (e) { return alert(e.message) }
    onChange()
  }

  return (
    <div className={`card ${due && late > 0 ? 'ring-red-300' : due ? 'ring-amber-400' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold">{s.full_name} <span className="text-sm font-normal text-slate-500">Seat {s.seat_no}</span></p>
          <p className="mt-0.5 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{tag(s)}</p>
          <p className="text-sm text-slate-600">{s.phone} · {rupees(s.monthly_fee)}/month</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.status === 'Active' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>{s.status}</span>
      </div>
      {s.status === 'Active' && (
        <p className={`mt-2 text-sm font-bold ${due ? (late > 0 ? 'text-red-700' : 'text-amber-700') : 'text-slate-600'}`}>
          {due ? (late > 0 ? `Overdue by ${late} day${late > 1 ? 's' : ''}` : 'Due today') : 'Next due'} · {fmtDate(s.next_due_date)}
        </p>
      )}
      {s.advance_sent_for === s.next_due_date && s.advance_sent_on && <p className="text-sm text-slate-500">Advance reminder sent on {fmtDate(s.advance_sent_on)}</p>}
      {s.reminder_sent_on && due && <p className="text-sm text-slate-500">Reminder sent on {fmtDate(s.reminder_sent_on)}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {s.status === 'Active' && <button className="btn-primary" onClick={markPaid}>Mark as paid</button>}
        {due && <button className="btn-ghost" onClick={sendWhatsApp}>Send WhatsApp</button>}
        {advance && <button className="btn-ghost" onClick={sendAdvance}>Send advance reminder</button>}
        <button className="btn-ghost" onClick={toggleHistory}>{history ? 'Hide history' : 'History'}</button>
        {onEdit && <button className="btn-ghost" onClick={() => onEdit(s)}>Edit</button>}
        {onEdit && <button className="btn-danger" onClick={remove}>Delete</button>}
      </div>
      {history && (
        <ul className="mt-3 divide-y divide-slate-200 text-sm">
          {history.length === 0 && <li className="py-1 text-slate-500">No payments yet.</li>}
          {history.map((p) => <li key={p.id} className="flex justify-between py-1"><span>{fmtDate(p.paid_on)}</span><span>{rupees(p.amount)}</span></li>)}
        </ul>
      )}
    </div>
  )
}
