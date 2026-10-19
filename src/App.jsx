import { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { DataProvider, useData } from './lib/data'
import { dueStudents } from './components/DueList'
import { isUpcoming } from './lib/utils'
import Spinner from './components/Spinner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
const Students = lazy(() => import('./pages/Students'))
const Seats = lazy(() => import('./pages/Seats'))
const Reminders = lazy(() => import('./pages/Reminders'))
const Settings = lazy(() => import('./pages/Settings'))

const PATHS = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17.5" cy="9" r="2.5" /><path d="M17 14c3 0 4.5 2 4.5 5" /></>,
  seats: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  bell: <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></>
}
const Icon = ({ name }) => <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[name]}</svg>

const tabs = [['/', 'Home', 'home'], ['/students', 'Students', 'users'], ['/seats', 'Seats', 'seats'], ['/reminders', 'Reminders', 'bell'], ['/settings', 'Settings', 'settings']]

function Shell() {
  const { students, loading, error, retry } = useData()
  const badge = dueStudents(students).length + students.filter((s) => isUpcoming(s) && s.advance_sent_for !== s.next_due_date).length
  return (
    <div className="mx-auto min-h-screen max-w-3xl pb-8">
      <header className="sticky top-0 z-20 bg-ink pt-[env(safe-area-inset-top)] shadow-md">
        <nav aria-label="Main">
          <ul className="flex">
            {tabs.map(([to, label, icon]) => (
              <li key={to} className="flex-1">
                <NavLink to={to} end className={({ isActive }) => `relative flex flex-col items-center gap-0.5 border-b-4 py-2 text-xs font-bold ${isActive ? 'border-teal-300 text-white' : 'border-transparent text-slate-300'}`}>
                  <Icon name={icon} />
                  {label}
                  {icon === 'bell' && badge > 0 && <span className="absolute right-[18%] top-1 min-w-[1.1rem] rounded-full bg-red-600 px-1 text-center text-[10px] leading-4 text-white">{badge}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="p-4">
        {loading ? <Spinner /> : error ? (
          <div className="card space-y-3">
            <p className="text-red-700">Could not load data: {error}</p>
            <p className="text-sm text-slate-600">If it says “Missing or insufficient permissions”, check the owner User UID in your Firestore rules.</p>
            <button className="btn-primary" onClick={retry}>Try again</button>
          </div>
        ) : (
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/seats" element={<Seats />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/due" element={<Navigate to="/reminders" replace />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        )}
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  useEffect(() => onAuthStateChanged(auth, (u) => setSession(u)), [])
  useEffect(() => { if (session !== undefined) document.getElementById('splash')?.remove() }, [session])
  if (session === undefined) return null // the splash screen from index.html is showing
  if (!session) return <Login />
  return <DataProvider><Shell /></DataProvider>
}
