import { useState } from 'react'
import { collection, doc, getDocs, orderBy, query, runTransaction, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { addMonths, daysLate, fillMessage, fmtDate, isDue, planLabel, rupees, today, waLink } from '../lib/utils'
import Sheet from './Sheet'

export default function StudentCard({ s, settings, onChange, onEdit, advance = false }) {
  const [history, setHistory] = useState(null)
  const [pay, setPay] = useState(null)      // amount text while the "Mark as paid" pop-up is open
  const [confirmDel, setConfirmDel] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const late = daysLate(s.next_due_date)
  const due = isDue(s)

  async function savePayment(e) {
    e.preventDefault()
    const amount = Number(pay)
    if (pay === '' || !(amount >= 0)) return setErr('Enter a valid amount.')
    setBusy(true); setErr('')
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'students', s.id)
        const snap = await tx.get(ref)
        tx.set(doc(collection(db, 'students', s.id, 'payments')), { paid_on: today(), amount, created_at: serverTimestamp() })
        tx.update(ref, { next_due_date: addMonths(snap.data().next_due_date, 1), reminder_sent_on: null })
      })
      setPay(null); setHistory(null); onChange()
    } catch (ex) { setErr(ex.message) }
    setBusy(false)
  }
  function openWhatsApp(text) {
    const url = waLink(s.phone, text)
    if (!window.open(url, '_blank')) window.location.href = url
  }
  async function sendWhatsApp() {
    openWhatsApp(fillMessage(settings.reminder_message, s, settings.owner_name, settings.library_name))
    try { await updateDoc(doc(db, 'students', s.id), { reminder_sent_on: today() }); onChange() } catch (ex) { setErr(ex.message) }
  }
  async function sendAdvance() {
    openWhatsApp(fillMessage(settings.advance_message, s, settings.owner_name, settings.library_name))
    try { await updateDoc(doc(db, 'students', s.id), { advance_sent_on: today(), advance_sent_for: s.next_due_date }); onChange() } catch (ex) { setErr(ex.message) }
  }
  async function toggleHistory() {
    if (history) return setHistory(null)
    try {
      const snap = await getDocs(query(collection(db, 'students', s.id, 'payments'), orderBy('paid_on', 'desc')))
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (ex) { setErr(ex.message) }
  }
  async function remove() {
    setBusy(true)
    try {
      const pays = await getDocs(collection(db, 'students', s.id, 'payments'))
      const batch = writeBatch(db)
      pays.docs.forEach((p) => batch.delete(p.ref))
      batch.delete(doc(db, 'students', s.id))
      await batch.commit()
      setConfirmDel(false); onChange()
    } catch (ex) { setErr(ex.message); setConfirmDel(false) }
    setBusy(false)
  }

  return (
    <div className={`card ${due && late > 0 ? 'ring-red-300' : due ? 'ring-amber-400' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold">{s.full_name} <span className="text-sm font-normal text-slate-500">Seat {s.seat_no}</span></p>
          <p className="mt-0.5 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{planLabel(s)}</p>
          <p className="text-sm text-slate-600">{s.phone} · {rupees(s.monthly_fee)}/month</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.status === 'Active' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>{s.status}</span>
      </div>
      {s.status === 'Active' && (
        <p className={`mt-2 text-sm font-bold ${due ? (late > 0 ? 'text-red-700' : 'text-amber-700') : 'text-slate-600'}`}>
          {due ? (late > 0 ? `Overdue by ${late} day${late > 1 ? 's' : ''}` : 'Due today') : (late >= -2 ? `${-late} day${late < -1 ? 's' : ''} left` : 'Next due')} · {fmtDate(s.next_due_date)}
        </p>
      )}
      {s.advance_sent_for === s.next_due_date && s.advance_sent_on && <p className="text-sm text-slate-500">Reminder sent on {fmtDate(s.advance_sent_on)}</p>}
      {s.reminder_sent_on && due && <p className="text-sm text-slate-500">Reminder sent on {fmtDate(s.reminder_sent_on)}</p>}
      {err && !confirmDel && pay === null && <p className="mt-2 text-sm text-red-700">{err}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {s.status === 'Active' && <button className="btn-primary" onClick={() => { setErr(''); setPay(String(s.monthly_fee)) }}>Mark as paid</button>}
        {due && <button className="btn-ghost" onClick={sendWhatsApp}>Send WhatsApp</button>}
        {advance && <button className="btn-ghost" onClick={sendAdvance}>Send reminder</button>}
        <button className="btn-ghost" onClick={toggleHistory}>{history ? 'Hide history' : 'History'}</button>
        {onEdit && <button className="btn-ghost" onClick={() => onEdit(s)}>Edit</button>}
        {onEdit && <button className="btn-danger" onClick={() => setConfirmDel(true)}>Delete</button>}
      </div>
      {history && (
        <ul className="mt-3 divide-y divide-slate-200 text-sm">
          {history.length === 0 && <li className="py-1 text-slate-500">No payments yet.</li>}
          {history.map((p) => <li key={p.id} className="flex justify-between py-1"><span>{fmtDate(p.paid_on)}</span><span>{rupees(p.amount)}</span></li>)}
        </ul>
      )}
      {pay !== null && (
        <Sheet title="Mark as paid" z="z-40" onClose={() => setPay(null)}>
          <form onSubmit={savePayment} className="space-y-3">
            <p>{s.full_name} · Seat {s.seat_no} · {planLabel(s)}</p>
            <label className="block text-sm font-bold">Amount received (₹)
              <input className="input mt-1 font-normal" type="number" inputMode="decimal" min="0" autoFocus value={pay} onChange={(e) => setPay(e.target.value)} />
            </label>
            <p className="text-sm text-slate-600">Next due date moves to {fmtDate(addMonths(s.next_due_date, 1))}.</p>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save payment'}</button>
          </form>
        </Sheet>
      )}
      {confirmDel && (
        <Sheet title="Delete student?" z="z-40" onClose={() => setConfirmDel(false)}>
          <div className="space-y-3">
            <p>{s.full_name} and all payment history will be deleted. This cannot be undone. To keep the records, edit the student and set the status to Left instead.</p>
            <div className="flex gap-2"><button className="btn-danger flex-1" disabled={busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete'}</button><button className="btn-ghost flex-1" onClick={() => setConfirmDel(false)}>Cancel</button></div>
          </div>
        </Sheet>
      )}
    </div>
  )
}
