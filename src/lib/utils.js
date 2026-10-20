// Dates are handled as 'YYYY-MM-DD' strings in the phone's local time.
const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => toISO(new Date())

export function addMonths(iso, n = 1) {
  const [y, m, d] = iso.split('-').map(Number)
  const last = new Date(y, m - 1 + n + 1, 0).getDate() // clamp 31 Jan -> 28 Feb
  return toISO(new Date(y, m - 1 + n, Math.min(d, last)))
}
export const daysLate = (due) => Math.round((new Date(today()) - new Date(due)) / 86400000)
export const isDue = (s) => s.status === 'Active' && s.next_due_date <= today()
export const fmtDate = (iso) => new Date(iso + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
export const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')

export function fillMessage(template, s, ownerName = '', libraryName = '') {
  return template
    .replaceAll('{name}', s.full_name).replaceAll('{amount}', Number(s.monthly_fee))
    .replaceAll('{due_date}', fmtDate(s.next_due_date)).replaceAll('{seat}', s.seat_no)
    .replaceAll(' {library}', '').replaceAll('{library}', '').replaceAll('{owner_name}', ownerName).replaceAll('{library_name}', libraryName)
    .replaceAll('{plan}', planOf(s) === 'Half' ? 'Half time' : 'Full time').replaceAll('{timing}', timing(s))
}
export function waLink(phone, text) {
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 10) digits = '91' + digits
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}


// Advance reminder window: fee falls due tomorrow or the day after
export const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return toISO(new Date(y, m - 1, d + n)) }
export const isUpcoming = (s) => s.status === 'Active' && s.next_due_date > today() && s.next_due_date <= addDays(today(), 2)

// ---- Full time / Half time plans (half-time students have a From and To time) ----
export const planOf = (s) => s.plan === 'Half' ? 'Half' : 'Full'
export function fmtTime(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
export const timing = (s) => planOf(s) === 'Half' && s.time_from && s.time_to ? `${fmtTime(s.time_from)} to ${fmtTime(s.time_to)}` : ''
export const planLabel = (s) => planOf(s) === 'Half' ? `Half time${timing(s) ? ' · ' + timing(s) : ''}` : 'Full time'
const overlaps = (a, b) => a.time_from < b.time_to && b.time_from < a.time_to

// Can `cand` take a seat that `others` (Active students on that seat) already use? Returns '' if yes, else the reason.
export function seatConflict(cand, others) {
  if (!others.length) return ''
  if (planOf(cand) === 'Full') return `This seat already has ${others[0].full_name}. A full-time student needs a seat to themselves.`
  const full = others.find((o) => planOf(o) === 'Full')
  if (full) return `${full.full_name} has this seat full time.`
  const clash = others.find((o) => o.time_from && o.time_to && overlaps(cand, o))
  if (clash) return `${clash.full_name} already has this seat from ${timing(clash)}. Choose a different time or seat.`
  return ''
}

// ---- Billing cycle: due date = joining date + 1 month; paying moves BOTH forward one month ----
export const dayOf = (iso) => Number(iso.slice(8, 10))
// Add n months but land on `day` (clamped to the month's length, so a 31st becomes 28/29/30 only when needed)
export function addMonthsDay(iso, n, day) {
  const [y, m] = iso.split('-').map(Number)
  const last = new Date(y, m - 1 + n + 1, 0).getDate()
  return toISO(new Date(y, m - 1 + n, Math.min(day, last)))
}
// What a student's dates become when a fee is paid
export function nextCycle(s) {
  const first = s.first_joined_on || s.joined_on
  const day = s.cycle_day || dayOf(first)
  return { joined_on: s.next_due_date, first_joined_on: first, cycle_day: day, next_due_date: addMonthsDay(s.next_due_date, 1, day) }
}
