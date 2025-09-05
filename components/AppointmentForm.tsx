'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// === Supabase client (your creds) ===
const supa = createClient(
  'https://tzbybtluhzntfhjexptw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YnlidGx1aHpudGZoamV4cHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTkxNzIsImV4cCI6MjA3MTk5NTE3Mn0.E-2Y9CupjktT67UwkCP3Bm7-cBDmkolk2RIo_sPyRHQ'
);

type FormState = {
  ownerName: string;
  phone: string;
  email: string;
  carrier: string;
  smsOptIn: boolean;
  petName: string;
  breed: string;
  weight: string; // we'll also use as size
  service: string;
  notes: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
};

export default function AppointmentForm() {
  const [form, setForm] = useState<FormState>({
    ownerName: '',
    phone: '',
    email: '',
    carrier: 'AT&T',
    smsOptIn: true,
    petName: '',
    breed: '',
    weight: '',
    service: 'Bath & Brush',
    notes: '',
    date: '',
    time: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = (e.target as HTMLInputElement).type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setForm({ ...form, [e.target.name]: v } as FormState);
  };

  // === helper that writes to Supabase ===
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setOk(null);
    setErr(null);

    try {
      if (!form.date || !form.time || !form.ownerName || !form.petName) {
        throw new Error('Please fill date, time, owner name, and pet name.');
      }

      // 1) create booking row
      const { data: booking, error: bErr } = await supa
        .from('bookings')
        .insert({
          when_date: form.date,           // date column
          when_time: form.time,           // text HH:MM
          owner_name: form.ownerName,
          status: 'booked',
          // optional: created_at auto
        })
        .select('id')
        .single();

      if (bErr) throw bErr;
      if (!booking?.id) throw new Error('No booking id returned.');

      // 2) add dog linked to the booking
      const { error: dErr } = await supa
        .from('booking_dogs')
        .insert({
          booking_id: booking.id,
          dog_name: form.petName,
          size: form.weight || 'Medium',
          service: form.service || 'Bath & Brush',
          // you can add breed/notes as extra columns later if you add them in the table
        });

      if (dErr) throw dErr;

      setOk('✅ Booking saved!');
      // (optional) clear only some fields
      setForm({ ...form, notes: '', date: '', time: '' });
    } catch (e: any) {
      setErr(e.message || 'Failed to save booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold">Request a Booking</h2>

      {ok && <div className="p-2 rounded border border-green-300 bg-green-50 text-green-800">{ok}</div>}
      {err && <div className="p-2 rounded border border-rose-300 bg-rose-50 text-rose-800">{err}</div>}

      <label className="grid gap-1">
        <span>Owner name</span>
        <input name="ownerName" value={form.ownerName} onChange={change} className="border rounded p-2" required />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Phone</span>
          <input name="phone" value={form.phone} onChange={change} className="border rounded p-2" />
        </label>
        <label className="grid gap-1">
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={change} className="border rounded p-2" />
        </label>
      </div>

      <label className="grid gap-1">
        <span>Pet name</span>
        <input name="petName" value={form.petName} onChange={change} className="border rounded p-2" required />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Breed</span>
          <input name="breed" value={form.breed} onChange={change} className="border rounded p-2" />
        </label>
        <label className="grid gap-1">
          <span>Weight/Size</span>
          <input name="weight" value={form.weight} onChange={change} className="border rounded p-2" placeholder="Small / 25lb / etc." />
        </label>
      </div>

      <label className="grid gap-1">
        <span>Service</span>
        <select name="service" value={form.service} onChange={change} className="border rounded p-2">
          <option>Bath & Brush</option>
          <option>Full Groom (Small)</option>
          <option>Full Groom (Medium)</option>
          <option>Deshedding Add-on</option>
        </select>
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span>Date</span>
          <input type="date" name="date" value={form.date} onChange={change} className="border rounded p-2" required />
        </label>
        <label className="grid gap-1">
          <span>Time</span>
          <input type="time" name="time" value={form.time} onChange={change} className="border rounded p-2" required />
        </label>
      </div>

      <label className="grid gap-1">
        <span>Notes</span>
        <textarea name="notes" value={form.notes} onChange={change} className="border rounded p-2" rows={3} />
      </label>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" name="smsOptIn" checked={form.smsOptIn} onChange={change} />
        <span>SMS updates ok</span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Request Booking'}
      </button>
    </form>
  );
}
