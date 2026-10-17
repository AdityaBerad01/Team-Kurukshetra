import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchTutorSlots, createSlot, deleteSlot } from '../api/slots'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Badge from '../components/ui/Badge'

const TODAY_DATE = new Date().toISOString().split('T')[0]

const ManageAvailability = () => {
  const { user } = useAuth()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Modal State
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [form, setForm] = useState({
    date: TODAY_DATE,
    start_time: '10:00',
    end_time: '11:00',
    teaching_mode: 'ONLINE',
  })

  // Load Tutor Slots
  useEffect(() => {
    let isMounted = true
    if (user?.id) {
      fetchTutorSlots(user.id)
        .then((data) => {
          if (isMounted) {
            setSlots(data || [])
            setError(null)
            setLoading(false)
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error('Failed to load slots:', err)
            setError(err.response?.data?.message || 'Failed to load availability slots.')
            setLoading(false)
          }
        })
    }
    return () => { isMounted = false }
  }, [user?.id, refreshKey])

  const validateForm = () => {
    const errs = {}
    if (!form.date) errs.date = 'Date is required.'
    else if (form.date < TODAY_DATE) errs.date = 'Cannot create slots on past dates.'

    if (!form.start_time) errs.start_time = 'Start time is required.'
    if (!form.end_time) errs.end_time = 'End time is required.'

    if (form.start_time && form.end_time && form.start_time >= form.end_time) {
      errs.end_time = 'End time must be after start time.'
    }
    return errs
  }

  const handleCreateSlot = async (e) => {
    e.preventDefault()
    setApiError(null)
    const errs = validateForm()
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      await createSlot(form)
      setModal(false)
      setForm({
        date: TODAY_DATE,
        start_time: '10:00',
        end_time: '11:00',
        teaching_mode: 'ONLINE',
      })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to create slot:', err)
      setApiError(err.response?.data?.message || 'Could not create availability slot.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) return

    try {
      await deleteSlot(slotId)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to delete slot:', err)
      alert(err.response?.data?.message || 'Failed to remove slot.')
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-primary-600" />
            Calendar Management
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Availability</h1>
          <p className="text-slate-500 text-sm mt-0.5">Define your appointment slots so students can schedule sessions with you.</p>
        </div>
        <button
          type="button"
          onClick={() => { setModal(true); setApiError(null); setFormErrors({}) }}
          className="btn-primary gap-2 font-bold shadow-md shadow-primary-600/25 flex-shrink-0"
        >
          <span>+ Add Time Slot</span>
        </button>
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm font-semibold text-slate-500 mt-4">Loading schedule…</p>
        </div>
      )}

      {!loading && error && (
        <div className="card bg-rose-50/80 border-rose-200 p-6 text-center">
          <p className="text-rose-700 font-bold mb-3">{error}</p>
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className="btn-secondary text-xs">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <EmptyState
          icon="📅"
          title="No availability slots configured"
          description="Create your first time block so students can discover you and request appointments."
          action={
            <button type="button" onClick={() => setModal(true)} className="btn-primary">
              + Add First Slot
            </button>
          }
        />
      )}

      {!loading && !error && slots.length > 0 && (
        <div className="card bg-white/95 border-slate-200/80 shadow-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Scheduled Availability Blocks ({slots.length})
            </h2>
            <span className="text-xs text-slate-400 font-medium">Slots ordered chronologically</span>
          </div>

          <div className="space-y-3">
            {slots.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:border-primary-300/80 transition-all bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex flex-col items-center justify-center border border-primary-200/60 shadow-inner">
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-base font-extrabold leading-none">
                      {s.date.split('-')[2]}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-900 text-sm">{s.date}</p>
                      <span className="text-xs text-slate-400">·</span>
                      <p className="text-xs font-bold text-primary-700">
                        ⏰ {s.start_time} – {s.end_time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={s.teaching_mode === 'ONLINE' ? 'blue' : 'green'}>
                        {s.teaching_mode === 'ONLINE' ? '💻 Online' : '📍 In-person'}
                      </Badge>
                      <Badge status={s.status === 'BOOKED' ? 'confirmed' : 'available'}>
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 flex items-center gap-2">
                  {s.status === 'AVAILABLE' ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(s.id)}
                      className="btn-ghost text-rose-600 hover:bg-rose-50 text-xs font-bold py-1 px-3"
                    >
                      Delete Slot
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 italic">
                      Booked Session
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Add New Availability Slot"
        size="md"
      >
        <form onSubmit={handleCreateSlot} noValidate className="space-y-4">
          {apiError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {apiError}
            </div>
          )}

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              min={TODAY_DATE}
              className={`input ${formErrors.date ? 'input-error' : ''}`}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            {formErrors.date && <p className="field-error">{formErrors.date}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time (24h)</label>
              <input
                type="time"
                className={`input ${formErrors.start_time ? 'input-error' : ''}`}
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
              {formErrors.start_time && <p className="field-error">{formErrors.start_time}</p>}
            </div>
            <div>
              <label className="label">End Time (24h)</label>
              <input
                type="time"
                className={`input ${formErrors.end_time ? 'input-error' : ''}`}
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
              {formErrors.end_time && <p className="field-error">{formErrors.end_time}</p>}
            </div>
          </div>

          <div>
            <label className="label">Teaching Mode</label>
            <div className="flex gap-3">
              {[
                { id: 'ONLINE', label: '💻 Online (Video)' },
                { id: 'ON_CAMPUS', label: '📍 In-person (Campus)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm({ ...form, teaching_mode: m.id })}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    form.teaching_mode === m.id
                      ? 'bg-primary-50 text-primary-800 border-primary-300 ring-2 ring-primary-500/20 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="btn-secondary flex-1 justify-center font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 justify-center font-bold shadow-md shadow-primary-600/25 disabled:opacity-50"
            >
              {saving ? 'Creating Slot…' : 'Publish Slot'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ManageAvailability
