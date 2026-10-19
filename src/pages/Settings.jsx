import { useState } from 'react'
import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { useData } from '../lib/data'
import { libOf } from '../lib/utils'

const FEES = [['fee_normal', 'Normal, no locker'], ['fee_normal_locker', 'Normal + locker'], ['fee_premium', 'Premium, no locker'], ['fee_premium_locker', 'Premium + locker']]

export default function Settings() {
  const { settings, students, reload } = useData()
  const [f, setF] = useState(settings)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const maxSeat = (lib) => Math.max(0, ...students.filter((s) => s.status === 'Active' && libOf(s) === lib).map((s) => s.seat_no))

  async function save(e) {
    e.preventDefault(); setMsg('')
    const sn = Number(f.seats_normal), sp = Number(f.seats_premium)
    if (sn < maxSeat('Normal')) return setMsg(`An Active Normal student sits at seat ${maxSeat('Normal')}. Normal seats cannot be fewer than that.`)
    if (sp < maxSeat('Premium')) return setMsg(`An Active Premium student sits at seat ${maxSeat('Premium')}. Premium seats cannot be fewer than that.`)
    const fees = Object.fromEntries(FEES.map(([k]) => [k, f[k] === '' ? '' : Number(f[k])]))
    try {
      await setDoc(doc(db, 'settings', 'main'), { owner_name: f.owner_name, owner_whatsapp: f.owner_whatsapp, seats_normal: sn, seats_premium: sp, ...fees, reminder_message: f.reminder_message, advance_message: f.advance_message }, { merge: true })
      // The WhatsApp number can also be used to sign in (it points to this account's email)
      const last10 = (x) => String(x || '').replace(/\D/g, '').slice(-10)
      const nd = last10(f.owner_whatsapp), od = last10(settings.owner_whatsapp)
      if (nd.length === 10) await setDoc(doc(db, 'loginAliases', nd), { email: auth.currentUser.email })
      if (od && od !== nd) await deleteDoc(doc(db, 'loginAliases', od))
      setMsg('Settings saved.'); reload()
    } catch (ex) { setMsg(ex.message) }
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <h1 className="text-2xl font-bold">Settings</h1>
      <label className="block text-sm font-bold">Owner name<input className="input mt-1 font-normal" value={f.owner_name} onChange={set('owner_name')} /></label>
      <label className="block text-sm font-bold">Owner WhatsApp number<input className="input mt-1 font-normal" inputMode="tel" placeholder="+91…" value={f.owner_whatsapp} onChange={set('owner_whatsapp')} /><span className="text-xs font-normal text-slate-500">You can also sign in with this number.</span></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-bold">Normal library seats<input className="input mt-1 font-normal" type="number" min="1" value={f.seats_normal} onChange={set('seats_normal')} /></label>
        <label className="block text-sm font-bold">Premium library seats<input className="input mt-1 font-normal" type="number" min="1" value={f.seats_premium} onChange={set('seats_premium')} /></label>
      </div>
      <fieldset className="card">
        <legend className="px-1 text-sm font-bold">Monthly fee for each option (₹)</legend>
        <div className="grid grid-cols-2 gap-3">
          {FEES.map(([k, label]) => <label key={k} className="block text-sm font-bold">{label}<input className="input mt-1 font-normal" type="number" min="0" value={f[k]} onChange={set(k)} /></label>)}
        </div>
        <p className="mt-2 text-xs text-slate-500">These fill in automatically when you add a student. You can still change the fee for one student.</p>
      </fieldset>
      <label className="block text-sm font-bold">Reminder message
        <textarea className="input mt-1 font-normal" rows="4" value={f.reminder_message} onChange={set('reminder_message')} />
        <span className="text-xs font-normal text-slate-500">Use {'{name}'} and {'{amount}'}; they are replaced for each student.</span>
      </label>
      <label className="block text-sm font-bold">Reminder message (when 2 days are left)
        <textarea className="input mt-1 font-normal" rows="5" value={f.advance_message} onChange={set('advance_message')} />
        <span className="text-xs font-normal text-slate-500">You can use {'{name}'}, {'{amount}'}, {'{due_date}'}, {'{seat}'}, {'{library}'} and {'{owner_name}'}.</span>
      </label>
      {msg && <p className="text-sm font-bold">{msg}</p>}
      <div className="flex gap-2">
        <button className="btn-primary">Save settings</button>
        <button type="button" className="btn-ghost" onClick={() => signOut(auth)}>Sign out</button>
      </div>
    </form>
  )
}
