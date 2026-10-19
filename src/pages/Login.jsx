import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try { await signInWithEmailAndPassword(auth, email, password) }
    catch (ex) { setErr(ex.code === 'auth/invalid-credential' ? 'Wrong email or password.' : ex.message) }
    setBusy(false)
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="mb-1 text-3xl font-bold">Library Fees</h1>
      <p className="mb-6 text-slate-600">Sign in to manage students and fees.</p>
      <form onSubmit={submit} className="space-y-3">
        <input className="input" type="email" placeholder="Email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
