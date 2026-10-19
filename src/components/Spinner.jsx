export default function Spinner({ label = 'Loading…' }) {
  return <div className="flex items-center gap-3 p-6 text-slate-600"><span className="h-6 w-6 animate-spin rounded-full border-4 border-slate-300 border-t-brand" />{label}</div>
}
