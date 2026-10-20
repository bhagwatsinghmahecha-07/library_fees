import { useState } from 'react'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// Accepts an email, or a 10-digit phone number saved in Settings
async function resolveEmail(input) {
  const id = input.trim()
  if (id.includes('@')) return id
  const digits = id.replace(/\D/g, '').slice(-10)
  if (digits.length < 10) throw new Error('Enter a valid email or 10-digit phone number.')
  let snap
  try { snap = await getDoc(doc(db, 'loginAliases', digits)) }
  catch { throw new Error('Phone sign-in is not set up yet. Sign in with your email, then save your WhatsApp number in Settings.') }
  if (!snap.exists()) throw new Error('This phone number is not set up for sign-in. Use your email, or save your WhatsApp number in Settings after signing in.')
  return snap.data().email
}
const mask = (e) => e.replace(/^(.).*(@.*)$/, '$1•••$2')
const friendly = (ex) => {
  const c = ex.code || ''
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(c)) return 'Wrong email/phone or password.'
  if (c === 'auth/too-many-requests') return 'Too many tries. Wait a few minutes, or use Forgot password.'
  if (c === 'auth/network-request-failed') return 'No internet connection. Try again.'
  return ex.message
}

export default function Login() {
  const [mode, setMode] = useState('login') // login | forgot
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  let libName = ''
  try { libName = localStorage.getItem('libraryName') || '' } catch { /* storage not available */ }

  async function signIn(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try { await signInWithEmailAndPassword(auth, await resolveEmail(id), password) }
    catch (ex) { setErr(friendly(ex)) }
    setBusy(false)
  }
  async function reset(e) {
    e.preventDefault(); setBusy(true); setErr(''); setInfo('')
    try {
      const email = await resolveEmail(id)
      await sendPasswordResetEmail(auth, email)
      setInfo(`If this account exists, a reset link was sent to ${mask(email)}. Open it, choose a new password, then sign in. Check Spam too.`)
    } catch (ex) { setErr(friendly(ex)) }
    setBusy(false)
  }
  const go = (m) => { setMode(m); setErr(''); setInfo('') }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="mb-1 text-3xl font-bold">{libName || 'Library Fees'}</h1>
      <p className="mb-6 text-slate-600">{mode === 'login' ? 'Sign in to manage students and fees.' : 'Enter your email or phone number. We will email you a link to set a new password.'}</p>
      <form onSubmit={mode === 'login' ? signIn : reset} className="space-y-3">
        <input className="input" type="text" inputMode="email" autoCapitalize="none" autoCorrect="off" placeholder="Email or phone number" autoComplete="username" required value={id} onChange={(e) => setId(e.target.value)} />
        {mode === 'login' && (
          <div className="relative">
            <input className="input pr-20" type={show ? 'text' : 'password'} placeholder="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)} aria-pressed={show} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-sm font-bold text-brand">{show ? 'Hide' : 'Show'}</button>
          </div>
        )}
        {err && <p className="text-sm text-red-700">{err}</p>}
        {info && <p className="text-sm text-teal-800">{info}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Send reset link'}</button>
      </form>
      <button type="button" className="mt-4 text-sm font-bold text-brand underline" onClick={() => go(mode === 'login' ? 'forgot' : 'login')}>
        {mode === 'login' ? 'Forgot password?' : 'Back to sign in'}
      </button>
    </div>
  )
}
