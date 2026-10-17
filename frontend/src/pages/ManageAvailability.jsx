import { useState } from 'react'
import { SAMPLE_AVAILABILITY, ALL_DAYS, ALL_TIME_SLOTS } from '../data/sampleData'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import AvailabilitySlotCard from '../components/AvailabilitySlotCard'

const ManageAvailability = () => {
  const [slots, setSlots] = useState(SAMPLE_AVAILABILITY)
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState({ day: '', times: [] })
  const [saved, setSaved] = useState(false)

  const usedDays = slots.map((s) => s.day)
  const availableDays = ALL_DAYS.filter((d) => !usedDays.includes(d))

  const toggleTime = (t) => {
    setForm((f) => ({
      ...f,
      times: f.times.includes(t) ? f.times.filter((x) => x !== t) : [...f.times, t],
    }))
  }

  const handleAdd = () => {
    if (!form.day || form.times.length === 0) return
    setSlots((s) => [...s, { id: `av${Date.now()}`, day: form.day, slots: form.times }])
    setForm({ day: '', times: [] })
    setModal(false)
  }

  const removeSlot = (dayId, time) => {
    setSlots((sl) =>
      sl
        .map((s) => (s.id === dayId ? { ...s, slots: s.slots.filter((t) => t !== time) } : s))
        .filter((s) => s.slots.length > 0),
    )
  }

  const removeDay = (dayId) => setSlots((sl) => sl.filter((s) => s.id !== dayId))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-primary-600" />
            Calendar Management
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Weekly Availability</h1>
          <p className="text-slate-500 text-sm mt-0.5">Specify recurrent weekly time blocks when students can book appointments.</p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setModal(true)}
            disabled={availableDays.length === 0}
            className="btn-secondary gap-2 font-semibold"
          >
            + Add Available Day
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary gap-2 font-bold shadow-md shadow-primary-600/25"
          >
            {saved ? '✅ Saved!' : '💾 Save Schedule'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-800 flex items-center gap-2">
        <span>⚠️</span>
        <span>Availability slots update locally. Backend sync with tutor availability collection is in progress.</span>
      </div>

      {slots.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No availability configured"
          description="Add your first working day so students can schedule sessions with you."
          action={
            <button type="button" onClick={() => setModal(true)} className="btn-primary">
              + Add Available Day
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {slots.map(({ id, day, slots: times }) => (
            <AvailabilitySlotCard
              key={id}
              day={day}
              slots={times}
              isEditable={true}
              onRemoveDay={() => removeDay(id)}
              onRemoveSlot={(time) => removeSlot(id, time)}
            />
          ))}
        </div>
      )}

      {/* Add Day Modal */}
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm({ day: '', times: [] }) }}
        title="Add Available Weekly Schedule"
        size="md"
      >
        <div className="space-y-5">
          <div>
            <label className="label">Day of the Week</label>
            <select
              className="input"
              value={form.day}
              onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
            >
              <option value="">Select a day</option>
              {availableDays.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label mb-0">Select Time Slots</label>
              {form.times.length > 0 && (
                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200/60">
                  {form.times.length} selected
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 max-h-56 overflow-y-auto p-1">
              {ALL_TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTime(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.times.includes(t)
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 border-primary-600 text-white shadow-sm ring-2 ring-primary-400/40'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:bg-slate-50'
                  }`}
                >
                  {t}
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
              type="button"
              onClick={handleAdd}
              disabled={!form.day || form.times.length === 0}
              className="btn-primary flex-1 justify-center font-bold shadow-md shadow-primary-600/25"
            >
              Confirm Day {form.times.length > 0 ? `(${form.times.length} slots)` : ''}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ManageAvailability
