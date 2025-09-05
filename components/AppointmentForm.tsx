'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// === Supabase (your project) ===
const SUPABASE_URL = 'https://tzbybtluhzntfhjexptw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YnlidGx1aHpudGZoamV4cHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTkxNzIsImV4cCI6MjA3MTk5NTE3Mn0.E-2Y9CupjktT67UwkCP3Bm7-cBDmkolk2RIo_sPyRHQ';

const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Msg = string | null;

export default function AppointmentForm() {
  const [form, setForm] = useState({
    ownerName: '',
    phone: '',
    email: '',
    petName: '',
    size: 'Medium',
    notes: '',
    date: '',
    time: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<Msg>(null);
  const [err, setErr] = useState<Msg>(null);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = (e.target as HTMLInputElement).value;
    setForm({ ...form, [e.target.name]: v });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setOk(null);
    setErr(null);

    try {
      // 1) create the booking row
      const { data: booking, error: bErr } = await supa
        .from('bookings')
        .insert({
          when_date: form.date,          // e.g. "2025-09-05"
          when_time: form.time,          // e.g. "14:00"
          owner_name: form.ownerName,    // text
          status: 'booked',              // optional; ok if column exists
        })
        .select('id')
        .single();

      if (bErr) throw bErr;
      if (!booking?.id) throw new Error('No booking id returned');

      // 2) link the dog to that booking
      const { error: dErr } = await supa.from('booking_dogs').insert({
        booking_id: booking.id,
        dog_name: form.petName,
        size: form.size || 'Medium',
      });

      if (dErr) throw dErr;

      setOk('Request received! We’ll confirm shortly.');
      // clear only fields users re-enter every time
      setForm({ ...form, petName: '', notes: '', time: '', date: '' });
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong saving your request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-md">
      <h2 className="text-xl font-semibold">Request an appointment</h2>

      {ok && <div className="rounded-md border border-emerald-300 bg-emerald-50 p-2 text-emerald-800">{ok}</div>}
      {err && <div className="rounded-md border border-rose-300 bg-rose-50 p-2 text-rose-800">{err}</div>}

      <label className="grid gap-1">
        <span>Your name</span>
        <input
          name="ownerName"
          value={form.ownerName}
          onChange={change}
          required
          className="border rounded-md p-2"
          placeholder="Jane Doe"
        />
      </label>

      <label className="grid gap-1">
        <span>Phone</span>
        <input
          name="phone"
          value={form.phone}
          onChange={change}
          className="border rounded-md p-2"
          placeholder="(555) 123-4567"
        />
      </label>

      <label className="grid gap-1">
        <span>Email</span>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={change}
          className="border rounded-md p-2"
          placeholder="you@example.com"
        />
      </label>

      <label className="grid gap-1">
        <span>Pet name</span>
        <input
          name="petName"
          value={form.petName}
          onChange={change}
          required
          className="border rounded-md p-2"
          placeholder="Buddy"
        />
      </label>

      <label className="grid gap-1">
        <span>Size</span>
        <select name="size" value={form.size} onChange={change} className="border rounded-md p-2">
          <option>Small</option>
          <option>Medium</option>
          <option>Large</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Date</span>
          <input type="date" name="date" value={form.date} onChange={change} required className="border rounded-md p-2" />
        </label>
        <label className="grid gap-1">
          <span>Time</span>
          <input type="time" name="time" value={form.time} onChange={change} required className="border rounded-md p-2" />
        </label>
      </div>

      <label className="grid gap-1">
        <span>Notes</span>
        <textarea
          name="notes"
          value={form.notes}
          onChange={change}
          className="border rounded-md p-2"
          rows={3}
          placeholder="Anything we should know?"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Request Booking'}
      </button>
    </form>
  );
}
