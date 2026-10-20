import { useState } from 'react'
import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { useData } from '../lib/data'

export default function Settings() {
  const { settings, students, reload } = useData()
  const [f, setF] = useState(settings)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const maxSeat = Math.max(0, ...students.filter((s) => s.status === 'Active').map((s) => s.seat_no))

  async function save(e) {
    e.preventDefault(); setMsg('')
    const seats = Number(f.total_seats)
    if (!(seats >= 1)) return setMsg('Total seats must be at least 1.')
    if (seats < maxSeat) return setMsg(`An Active student sits at seat ${maxSeat}. Total seats cannot be lower than that.`)
    setBusy(true)
    try {
      await setDoc(doc(db, 'settings', 'main'), {
        library_name: f.library_name.trim(), owner_name: f.owner_name, owner_whatsapp: f.owner_whatsapp, total_seats: seats,
        fee_full: f.fee_full === '' ? '' : Number(f.fee_full), fee_half: f.fee_half === '' ? '' : Number(f.fee_half),
        half_from: f.half_from, half_to: f.half_to,
        reminder_message: f.reminder_message, advance_message: f.advance_message
      }, { merge: true })
      // The WhatsApp number can also be used to sign in (it points to this account's email)
      const last10 = (x) => String(x || '').replace(/\D/g, '').slice(-10)
      const nd = last10(f.owner_whatsapp), od = last10(settings.owner_whatsapp)
      if (nd.length === 10) await setDoc(doc(db, 'loginAliases', nd), { email: auth.currentUser.email })
      if (od && od !== nd) await deleteDoc(doc(db, 'loginAliases', od))
      setMsg('Settings saved.'); reload()
    } catch (ex) { setMsg(ex.message) }
    setBusy(false)
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <h1 className="text-2xl font-bold">Settings</h1>
      <label className="block text-sm font-bold">Library name<input className="input mt-1 font-normal" placeholder="e.g. Sharma Study Library" value={f.library_name} onChange={set('library_name')} /><span className="text-xs font-normal text-slate-500">Shown at the top of your dashboard.</span></label>
      <label className="block text-sm font-bold">Owner name<input className="input mt-1 font-normal" value={f.owner_name} onChange={set('owner_name')} /></label>
      <label className="block text-sm font-bold">Owner WhatsApp number<input className="input mt-1 font-normal" inputMode="tel" placeholder="+91…" value={f.owner_whatsapp} onChange={set('owner_whatsapp')} /><span className="text-xs font-normal text-slate-500">You can also sign in with this number.</span></label>
      <label className="block text-sm font-bold">Total seats<input className="input mt-1 font-normal" type="number" inputMode="numeric" min="1" value={f.total_seats} onChange={set('total_seats')} /><span className="text-xs font-normal text-slate-500">You can increase or decrease the seats any time.</span></label>
      <fieldset className="card space-y-3">
        <legend className="px-1 text-sm font-bold">Plans and fees</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold">Full time fee (₹)<input className="input mt-1 font-normal" type="number" inputMode="decimal" min="0" value={f.fee_full} onChange={set('fee_full')} /></label>
          <label className="block text-sm font-bold">Half time fee (₹)<input className="input mt-1 font-normal" type="number" inputMode="decimal" min="0" value={f.fee_half} onChange={set('fee_half')} /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold">Half time from<input className="input mt-1 font-normal" type="time" value={f.half_from} onChange={set('half_from')} /></label>
          <label className="block text-sm font-bold">Half time to<input className="input mt-1 font-normal" type="time" value={f.half_to} onChange={set('half_to')} /></label>
        </div>
        <p className="text-xs text-slate-500">Fees and times fill in when you add a student. You can change them for one student, and change the default half time here any time.</p>
      </fieldset>
      <label className="block text-sm font-bold">Reminder message (fee due)
        <textarea className="input mt-1 font-normal" rows="4" value={f.reminder_message} onChange={set('reminder_message')} />
        <span className="text-xs font-normal text-slate-500">Use {'{name}'}, {'{amount}'}, {'{plan}'}, {'{timing}'} and {'{library_name}'}; they are replaced for each student.</span>
      </label>
      <label className="block text-sm font-bold">Reminder message (when 2 days are left)
        <textarea className="input mt-1 font-normal" rows="5" value={f.advance_message} onChange={set('advance_message')} />
        <span className="text-xs font-normal text-slate-500">You can use {'{name}'}, {'{amount}'}, {'{due_date}'}, {'{seat}'}, {'{plan}'}, {'{timing}'}, {'{owner_name}'} and {'{library_name}'}.</span>
      </label>
      {msg && <p className="text-sm font-bold">{msg}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
        <button type="button" className="btn-ghost" onClick={() => signOut(auth)}>Sign out</button>
      </div>
    </form>
  )
}
