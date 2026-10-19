import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { DataProvider, useData } from './lib/data'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Seats from './pages/Seats'
import Due from './pages/Due'
import Settings from './pages/Settings'

const tabs = [['/', 'Home'], ['/students', 'Students'], ['/seats', 'Seats'], ['/due', 'Due'], ['/settings', 'Settings']]

function Shell() {
  const { loading, error } = useData()
  return (
    <div className="mx-auto min-h-screen max-w-3xl pb-24">
      <main className="p-4">
        {loading ? <p>Loading…</p> : error ? <p className="card text-red-700">Could not load data: {error}. Check your Firestore rules and the owner User UID in them.</p> : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/seats" element={<Seats />} />
            <Route path="/due" element={<Due />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-300 bg-ink pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-3xl">
          {tabs.map(([to, label]) => (
            <li key={to} className="flex-1">
              <NavLink to={to} end className={({ isActive }) => `block py-3 text-center text-sm font-bold ${isActive ? 'bg-brand text-white' : 'text-slate-300'}`}>{label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  useEffect(() => onAuthStateChanged(auth, (u) => setSession(u)), [])
  if (session === undefined) return <p className="p-4">Loading…</p>
  if (!session) return <Login />
  return <DataProvider><Shell /></DataProvider>
}
