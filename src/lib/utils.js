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
}
export function waLink(phone, text) {
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 10) digits = '91' + digits
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}


// Advance reminder window: fee falls due tomorrow or the day after
export const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return toISO(new Date(y, m - 1, d + n)) }
export const isUpcoming = (s) => s.status === 'Active' && s.next_due_date > today() && s.next_due_date <= addDays(today(), 2)
