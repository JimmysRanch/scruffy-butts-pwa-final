'use client'
import { useState } from 'react'

export default function AppointmentForm() {
  const [form, setForm] = useState({
    ownerName: '', phone: '', email: '', carrier: 'AT&T', smsOptIn: true,
    petName: '', breed: '', weight: '',
    service: 'Bath & Brush', notes: '',
    date: '', time: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const change = (e: any) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: v })
  }

  const submit = async (e: any) => {
    e.preventDefault()
    setSubmitting(true); setOk(null); setErr(null)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setOk('Appointment requested! Check your email/text for confirmation.')
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 max-w-2xl">
      <h2 className="text-2xl font-bold">Book an appointment</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <input name="ownerName" placeholder="Your name" className="input" value={form.ownerName} onChange={change} required />
        <input name="phone" placeholder="Phone" className="input" value={form.phone} onChange={change} required />
        <input name="email" placeholder="Email" className="input md:col-span-2" value={form.email} onChange={change} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <select name="carrier" className="input" value={form.carrier} onChange={change}>
          <option>AT&T</option><option>Verizon</option><option>T-Mobile</option>
          <option>Cricket</option><option>Boost Mobile</option><option>US Cellular</option>
          <option>MetroPCS</option><option>Google Fi</option><option>Straight Talk</option>
          <option>Other/Unknown</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="smsOptIn" checked={form.smsOptIn} onChange={change} />
          SMS reminders
        </label>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <input name="petName" placeholder="Pet name" className="input" value={form.petName} onChange={change} required />
        <input name="breed" placeholder="Breed" className="input" value={form.breed} onChange={change} />
        <input name="weight" placeholder="Weight (lbs)" className="input" value={form.weight} onChange={change} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <select name="service" className="input" value={form.service} onChange={change}>
          <option>Bath & Brush</option>
          <option>Full Groom</option>
          <option>Puppy Intro</option>
          <option>Nail Trim</option>
        </select>
        <input type="date" name="date" className="input" value={form.date} onChange={change} required />
        <input type="time" name="time" className="input" value={form.time} onChange={change} required />
      </div>
      <textarea name="notes" placeholder="Notes" className="input min-h-24" value={form.notes} onChange={change} />
      <button disabled={submitting} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Request Appointment'}
      </button>
      {ok && <p className="text-green-600">{ok}</p>}
      {err && <p className="text-red-600">{err}</p>}
      <style jsx>{`
        .input { border: 1px solid #ddd; border-radius: 4px; padding: 8px; width: 100%; }
      `}</style>
    </form>
  )
}
