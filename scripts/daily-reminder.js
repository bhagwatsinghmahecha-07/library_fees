// Runs every day from GitHub Actions. Sends ONE WhatsApp message to the owner via CallMeBot:
//  - students due today or overdue
//  - students with 2 days or less left who have not been reminded yet
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const { FIREBASE_SERVICE_ACCOUNT, CALLMEBOT_API_KEY, CALLMEBOT_PHONE, SITE_URL } = process.env
for (const [k, v] of Object.entries({ FIREBASE_SERVICE_ACCOUNT, CALLMEBOT_API_KEY, CALLMEBOT_PHONE })) {
  if (!v) { console.error(`Missing secret: ${k}`); process.exit(1) }
}

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()) // YYYY-MM-DD in IST
const plus2 = (() => { const d = new Date(today + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 2); return d.toISOString().slice(0, 10) })()
initializeApp({ credential: cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)) })

let due, soon, libName = ''
try {
  // Single-field filter (no index needed); "Left" students are skipped below.
  const cfg = await getFirestore().doc('settings/main').get()
  libName = cfg.exists ? (cfg.data().library_name || '') : ''
  const snap = await getFirestore().collection('students').where('next_due_date', '<=', plus2).get()
  const all = snap.docs.map((d) => d.data()).filter((s) => s.status === 'Active')
    .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
  due = all.filter((s) => s.next_due_date <= today)
  soon = all.filter((s) => s.next_due_date > today && s.advance_sent_for !== s.next_due_date) // 1-2 days left, not reminded yet
} catch (e) { console.error('Firebase error:', e.message); process.exit(1) }

if (!due.length && !soon.length) { console.log('Nobody is due or due in 2 days. No message sent.'); process.exit(0) }

const days = (d) => Math.round((new Date(today) - new Date(d)) / 86400000)
const who = (s) => `${s.full_name}, Seat ${s.seat_no}, ${s.phone}, Rs ${Number(s.monthly_fee)}`
const parts = []
if (due.length) parts.push([`Overdue or due today: ${due.length}`, ...due.map((s) => `• ${who(s)} (${days(s.next_due_date) > 0 ? `${days(s.next_due_date)}d overdue` : 'due today'})`)].join('\n'))
if (soon.length) parts.push([`2 days left, send reminder: ${soon.length}`, ...soon.map((s) => `• ${who(s)} (due ${s.next_due_date.split('-').reverse().join('-')})`)].join('\n'))
if (libName) parts.unshift(libName)
if (SITE_URL) parts.push(`Open: ${SITE_URL.replace(/\/$/, '')}/#/reminders`)
const text = parts.join('\n\n')

const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(CALLMEBOT_PHONE)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(CALLMEBOT_API_KEY)}`
const res = await fetch(url)
const body = await res.text()
if (!res.ok) { console.error('CallMeBot failed:', res.status, body.slice(0, 300)); process.exit(1) } // red X in GitHub + email
console.log(`WhatsApp alert sent: ${due.length} due, ${soon.length} due in 2 days.`)
