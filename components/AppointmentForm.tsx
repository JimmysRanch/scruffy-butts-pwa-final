'use client';

import React, { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// === Supabase (your project) ===
const SUPABASE_URL = 'https://tzbybtluhzntfhjexptw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YnlidGx1aHpudGZoamV4cHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTkxNzIsImV4cCI6MjA3MTk5NTE3Mn0.E-2Y9CupjktT67UwkCP3Bm7-cBDmkolk2RIo_sPyRHQ';
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === Base service prices ===
const SERVICE_PRICES: Record<string, number> = {
  'Bath & Brush': 35,
  'Full Groom (Small)': 65,
  'Full Groom (Medium)': 85,
  'Deshedding Add-on': 20, // (service option, if chosen as main service)
};

// === Optional add-ons (can be combined with any main service) ===
const ADDONS: { key: string; label: string; price: number }[] = [
  { key: 'deshed', label: 'Deshedding', price: 20 },
  { key: 'nails', label: 'Nail Trim', price: 10 },
  { key: 'teeth', label: 'Teeth Brushing', price: 10 },
  { key: 'anal',  label: 'Anal Glands', price: 10 },
];

type AddonState = Record<string, boolean>;

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
  const [addons, setAddons] = useState<AddonState>({});
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // live totals
  const servicePrice = useMemo(
    () => SERVICE_PRICES[form.service] ?? 0,
    [form.service]
  );
  const addonsTotal = useMemo(
    () =>
      ADDONS.reduce((sum, a) => (addons[a.key] ? sum + a.price : sum), 0),
    [addons]
  );
  const subtotal = useMemo(() => servicePrice + addonsTotal, [servicePrice, addonsTotal]);
  const grandTotal = subtotal; // (no tax/fees yet; change here if needed)

  const change =
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };

  const toggleAddon = (key: string) => {
    setAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // basic phone normalizer (keeps digits only)
  const normalizePhone = (v: string) => v.replace(/\D+/g, '').slice(0, 15);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setOk(null);
    setErr(null);

    try {
      // build addons JSON payload with selected items + prices
      const selectedAddons = ADDONS
        .filter((a) => addons[a.key])
        .map((a) => ({ key: a.key, label: a.label, price: a.price }));

      // 1) write to bookings
      const { data: booking, error: bErr } = await supa
        .from('bookings')
        .insert({
          when_date: form.date,            // YYYY-MM-DD
          when_time: form.time,            // HH:MM
          owner_name: form.ownerName,
          phone: normalizePhone(form.phone),
          status: 'booked',
          notes: form.notes?.slice(0, 300) || null,
          grand_total: grandTotal,         // numeric
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
        addons: selectedAddons,            // jsonb
        subtotal: subtotal,                // numeric
      });
      if (dErr) throw dErr;

      setOk('Request received! We’ll confirm by text.');
      // reset
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
      setAddons({});
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // simple presentational helpers
  const rowStyle: React.CSSProperties = { display: 'flex', gap: 12 };
  const colStyle: React.CSSProperties = { flex: 1 };
  const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, marginTop: 8 };
  const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: 10,
    marginTop: 6,
    border: '1px solid #e5e7eb',
    borderRadius: 10,
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 8 }}>Book an appointment</h2>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>Pick a service, add extras, and we’ll text to confirm.</p>

      <div style={rowStyle}>
        <div style={colStyle}>
          <label style={labelStyle}>Owner name</label>
          <input
            name="ownerName"
            value={form.ownerName}
            onChange={change}
            required
            style={inputStyle}
            placeholder="e.g., Sarah Jones"
          />
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>Phone number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            style={inputStyle}
            placeholder="e.g., 2105550001"
          />
        </div>
      </div>

      <div style={rowStyle}>
        <div style={colStyle}>
          <label style={labelStyle}>Pet name</label>
          <input
            name="petName"
            value={form.petName}
            onChange={change}
            required
            style={inputStyle}
            placeholder="e.g., Rocky"
          />
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>Size</label>
          <select name="size" value={form.size} onChange={change} style={inputStyle}>
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </div>
      </div>

      <div style={rowStyle}>
        <div style={colStyle}>
          <label style={labelStyle}>Service</label>
          <select name="service" value={form.service} onChange={change} style={inputStyle}>
            <option>Bath & Brush</option>
            <option>Full Groom (Small)</option>
            <option>Full Groom (Medium)</option>
            <option>Deshedding Add-on</option>
          </select>
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>Date & Time</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={change}
              required
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={change}
              required
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>Add-ons</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}>
          {ADDONS.map((a) => (
            <label key={a.key} style={{
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={!!addons[a.key]}
                onChange={() => toggleAddon(a.key)}
              />
              <span style={{ flex: 1 }}>{a.label}</span>
              <span style={{ fontWeight: 700 }}>${a.price}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={change}
          rows={3}
          style={inputStyle}
          placeholder="Anything we should know?"
        />
      </div>

      {/* Totals */}
      <div style={{
        marginTop: 16,
        padding: 12,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        background: '#fafafa'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span>Service</span>
          <strong>${servicePrice.toFixed(2)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span>Add-ons</span>
          <strong>${addonsTotal.toFixed(2)}</strong>
        </div>
        <hr style={{ border: 0, borderTop: '1px solid #eee', margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
          <span><strong>Total</strong></span>
          <span><strong>${grandTotal.toFixed(2)}</strong></span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 16,
          padding: '12px 16px',
          borderRadius: 10,
          border: '1px solid #111',
          background: submitting ? '#e5e7eb' : '#111',
          color: '#fff',
          fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {submitting ? 'Submitting…' : 'Request booking'}
      </button>

      {ok && <div style={{ marginTop: 12, color: '#065f46', fontWeight: 600 }}>{ok}</div>}
      {err && <div style={{ marginTop: 12, color: '#b91c1c', fontWeight: 600 }}>{err}</div>}
    </form>
  );
}
