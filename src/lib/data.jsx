import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from './firebase'

const Ctx = createContext(null)
export const useData = () => useContext(Ctx)

const DEFAULTS = {
  owner_name: '', owner_whatsapp: '', seats_normal: 50, seats_premium: 20,
  fee_normal: '', fee_normal_locker: '', fee_premium: '', fee_premium_locker: '',
  reminder_message: 'Hello {name}, your library fee of ₹{amount} is due. Please pay within 2 days.',
  advance_message: 'Hello {name}, this is a friendly reminder from {owner_name}. Your {library} library fee of ₹{amount} (seat {seat}) is due on {due_date}. Please pay on or before the due date. Thank you!'
}

export function DataProvider({ children }) {
  const [students, setStudents] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const [st, se] = await Promise.all([getDocs(collection(db, 'students')), getDoc(doc(db, 'settings', 'main'))])
      setStudents(st.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.full_name.localeCompare(b.full_name)))
      setSettings({ ...DEFAULTS, ...(se.exists() ? se.data() : {}) })
      setError('')
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])
  return <Ctx.Provider value={{ students, settings, loading, error, reload }}>{children}</Ctx.Provider>
}
