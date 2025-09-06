'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// === Supabase (your project) ===
const SUPABASE_URL = 'https://tzbybtluhzntfhjexptw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YnlidGx1aHpudGZoamV4cHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTkxNzIsImV4cCI6MjA3MTk5NTE3Mn0.E-2Y9CupjktT67UwkCP3Bm7-cBDmkolk2RIo_sPyRHQ';
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === service prices (match your business) ===
const SERVICE_PRICES: Record<string, number> = {
  'Bath & Brush': 35,
  'Full Groom (Small)': 65,
  'Full Groom (Medium)': 85,
  'Deshedding Add-on': 20,
};

export default function AppointmentForm() {
  const [form, setForm] = useState({
    ownerName: '',
    phone: '',
    petName: '',
    size: 'Small',
    service: 'Bath & Brush',
    date: '',
    time: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const change = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setOk(null);
    setErr(null);

    try {
      // calculate grand total
      const price = SERVICE_PRICES[form.service] || 0;

      // 1) write to bookings
      const { data: booking, error: bErr } = await supa
        .from('bookings')
        .insert({
          when_date: form.date, // YYYY-MM-DD
          when_time: form.time, // HH:MM
          owner_name: form.ownerName,
          phone: form.phone,
          status: 'booked',
          notes: form.notes?.slice(0, 300) || null,
          grand_total: price,
        })
        .select('id')
        .single();

      if (bErr) throw bErr;
      const bookingId = booking.id;

      // 2) write the dog linked to booking
      const { error: dErr } = await supa.from('booking_dogs').insert({
        booking_id: bookingId,
        dog_name: form.petName || 'Dog',
        size: form.size || null,
        service: form.service || null,
        addons: {}, // optional jsonb
        subtotal: price,
      });

      if (dErr) throw dErr;

      setOk('Request received! We’ll confirm by text.');
      setForm({
        ownerName: '',
        phone: '',
        petName: '',
        size: 'Small',
        service: 'Bath & Brush',
        date: '',
        time: '',
        notes: '',
      });
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
      <form onSubmit={submit}>
        <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 12 }}>
          Book an appointment
        </h2>

        <label>
          Owner name
          <input
            name="ownerName"
            value={form.ownerName}
            onChange={change}
            required
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              margin: '6px 0 12px',
            }}
          />
        </label>

        <label>
          Phone number
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={change}
            required
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              margin: '6px 0 12px',
            }}
          />
        </label>

        <label>
          Pet name
          <input
            name="petName"
            value={form.petName}
            onChange={change}
            required
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              margin: '6px 0 12px',
            }}
          />
        </label>

        <label>
          Size
          <select
            name="size"
            value={form.size}
            onChange={change}
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              margin: '6px 0 12px',
            }}
          >
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </label>

        <label>
          Service
          <select
            name="service"
            value={form.service}
            onChange={change}
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              margin: '6px 0 12px',
            }}
          >
            <option>Bath & Brush</option>
            <option>Full Groom (Small)</option>
            <option>Full Groom (Medium)</option>
            <option>Deshedding Add-on</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1 }}>
            Date
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={change}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: 8,
                margin: '6px 0 12px',
              }}
            />
          </label>
          <label style={{ flex: 1 }}>
            Time
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={change}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: 8,
                margin: '6px 0 12px',
              }}
            />
          </label>
        </div>

        <label>
          Notes (optional)
          <textarea
            name="notes"
            value={form.notes}
            onChange={change}
            rows={3}
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              margin: '6px 0 12px',
            }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #ddd',
          }}
        >
          {submitting ? 'Submitting…' : 'Request booking'}
        </button>

        {ok && <div style={{ marginTop: 12, color: '#065f46' }}>{ok}</div>}
        {err && <div style={{ marginTop: 12, color: '#b91c1c' }}>{err}</div>}
      </form>
    </div>
  );
}
