import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { collection, doc, getDoc, getDocFromCache, getDocs, getDocsFromCache } from 'firebase/firestore'
import { db } from './firebase'

const Ctx = createContext(null)
export const useData = () => useContext(Ctx)

const DEFAULTS = {
  owner_name: '', owner_whatsapp: '', seats_normal: 50, seats_premium: 20,
  fee_normal: '', fee_normal_locker: '', fee_premium: '', fee_premium_locker: '',
  reminder_message: 'Hello {name}, your library fee of ₹{amount} is due. Please pay within 2 days.',
  advance_message: 'Hello {name}, this is a friendly reminder from {owner_name}. Your {library} library fee of ₹{amount} (seat {seat}) is due on {due_date}. Please pay on or before the due date. Thank you!'
}
const withTimeout = (p, ms = 15000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('Taking too long. Check your internet and try again.')), ms))])

export function DataProvider({ children }) {
  const [students, setStudents] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const have = useRef(false)

  const apply = (st, se) => {
    setStudents(st.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.full_name.localeCompare(b.full_name)))
    setSettings({ ...DEFAULTS, ...(se.exists() ? se.data() : {}) })
    have.current = true; setError(''); setLoading(false)
  }

  const reload = useCallback(async () => {
    // 1) Show the saved copy straight away (opens instantly on later visits)
    if (!have.current) {
      try {
        const [c1, c2] = await Promise.all([getDocsFromCache(collection(db, 'students')), getDocFromCache(doc(db, 'settings', 'main'))])
        apply(c1, c2)
      } catch { /* nothing saved yet */ }
    }
    // 2) Then fetch the latest from the server
    try {
      const [st, se] = await withTimeout(Promise.all([getDocs(collection(db, 'students')), getDoc(doc(db, 'settings', 'main'))]))
      apply(st, se)
    } catch (e) {
      if (!have.current) setError(e.message)
      setLoading(false)
    }
  }, [])
  const retry = useCallback(() => { setLoading(true); reload() }, [reload])

  useEffect(() => { reload() }, [reload])
  return <Ctx.Provider value={{ students, settings, loading, error, reload, retry }}>{children}</Ctx.Provider>
}
