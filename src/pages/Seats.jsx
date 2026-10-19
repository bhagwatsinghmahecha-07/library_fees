import { useState } from 'react'
import { useData } from '../lib/data'
import { isDue, libOf, seatsFor } from '../lib/utils'

export default function Seats() {
  const { students, settings } = useData()
  const [lib, setLib] = useState('Normal')
  const active = students.filter((s) => s.status === 'Active' && libOf(s) === lib)
  const bySeat = Object.fromEntries(active.map((s) => [s.seat_no, s]))
  const total = seatsFor(settings, lib)
  const seats = Array.from({ length: total }, (_, i) => i + 1)
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Seats</h1>
      <div className="flex gap-2">{['Normal', 'Premium'].map((x) => <button key={x} onClick={() => setLib(x)} className={lib === x ? 'btn-primary' : 'btn-ghost'}>{x}</button>)}</div>
      <p className="text-sm text-slate-600">{active.length} taken ({active.filter((s) => s.locker).length} with locker, {active.filter((s) => !s.locker).length} without), {Math.max(total - active.length, 0)} free. Green = taken, red outline = fee due, grey = empty.</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {seats.map((n) => {
          const s = bySeat[n]
          return (
            <div key={n} className={`rounded-lg p-2 text-sm ring-1 ${s ? (isDue(s) ? 'bg-teal-50 ring-2 ring-red-400' : 'bg-teal-50 ring-teal-300') : 'bg-white text-slate-400 ring-slate-200'}`}>
              <p className="font-bold">{n}{s?.locker && <span className="ml-1 text-xs font-normal text-slate-600">locker</span>}</p>
              <p className="truncate">{s ? s.full_name : 'Empty'}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
