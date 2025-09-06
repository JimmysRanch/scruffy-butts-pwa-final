'use client';

import React, { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// === Supabase (your project) ===
const SUPABASE_URL = 'https://tzbybtluhzntfhjexptw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YnlidGx1aHpudGZoamV4cHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTkxNzIsImV4cCI6MjA3MTk5NTE3Mn0.E-2Y9CupjktT67UwkCP3Bm7-cBDmkolk2RIo_sPyRHQ';
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === catalog (services + add-ons) ===
// tweak prices/labels anytime; total updates automatically
const SERVICES: { key: string; label: string; price: number }[] = [
  { key: 'bath_brush', label: 'Bath & Brush', price: 35 },
  { key: 'full_small', label: 'Full Groom (Small)', price: 65 },
  { key: 'full_med', label: 'Full Groom (Medium)', price: 85 },
];

const ADDONS: { key: string; label: string; price: number }[] = [
  { key: 'deshed', label: 'Deshedding', price: 20 },
  { key: 'nails', label: 'Nail Trim', price: 10 },
  { key: 'teeth', label: 'Teeth Brushing', price: 8 },
];

const SERVICE_PRICE_BY_LABEL: Record<string, number> = {
  'Bath & Brush': 35,
  'Full Groom (Small)': 65,
  'Full Groom (Medium)': 85,
};

export default function BookPage() {
  const [form, setForm] = useState({
    ownerName: '',
    phone: '',
    petName: '',
    size: 'Small',
    service: SERVICES[0].label, // use human label for easier reading in dashboard
    date: '',
    time: '',
    notes: '',
  });
  const [addonState, setAddonState] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // compute totals
  const { items, subtotal, grand } = useMemo(() => {
    const base = SERVICE_PRICE_BY_LABEL[form.service] || 0;
    const selectedAddons = ADDONS.filter(a => addonState[a.key]);
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const lineItems = [
      { type: 'service', label: form.service, price: base },
      ...selectedAddons.map(a => ({ type: 'addon', label: a.label, price: a.price })),
    ];
    return { items: lineItems, subtotal: base + addonsTotal, grand: base + addonsTotal };
  }, [form.service, addonState]);

  function change(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleAddon(k: string) {
    setAddonState(prev => ({ ...prev, [k]: !prev[k] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setOk(null);
    setErr(null);

    try {
      // 1) create booking (parent row)
      const { data: booking, error: bErr } = await supa
        .from('bookings')
        .insert({
          when_date: form.date,          // YYYY-MM-DD
          when_time: form.time,          // HH:MM (24h)
          owner_name: form.ownerName,
          phone: form.phone,
          status: 'booked',
          notes: form.notes?.slice(0, 300) || null,
          grand_total: grand,
        })
        .select('id')
        .single();

      if (bErr) throw bErr;
      const bookingId = booking.id;

      // 2) create dog row linked to booking (one dog per booking in this UI)
      const addonsPayload: Record<string, number> = {};
      ADDONS.forEach(a => {
        if (addonState[a.key]) addonsPayload[a.label] = a.price;
      });

      const { error: dErr } = await supa.from('booking_dogs').insert({
        booking_id: bookingId,
        dog_name: form.petName || 'Dog',
        size: form.size || null,
        service: form.service || null,
        addons: addonsPayload,       // jsonb
        subtotal: grand,             // subtotal for this dog (same as grand w/1 dog)
      });

      if (dErr) throw dErr;

      setOk('Request received! We’ll text you to confirm.');
      // soft reset but keep chosen service/size to speed repeated bookings
      setForm(f => ({
        ...f,
        ownerName: '',
        phone: '',
        petName: '',
        date: '',
        time: '',
        notes: '',
      }));
      setAddonState({});
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg,#f8fbff,#fff)',
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 16,
        }}
      >
        {/* Left: form */}
        <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 10px 30px -12px rgba(0,0,0,.15)' }}>
          <div style={{ padding: '14px 16px', background: '#ffe6f3', color: '#9c2f6f', fontWeight: 700, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            Book an appointment
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              <label>
                Owner name
                <input
                  name="ownerName"
                  value={form.ownerName}
                  onChange={change}
                  required
                  style={iStyle}
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
                  placeholder="e.g. 210-555-0001"
                  style={iStyle}
                />
              </label>

              <label>
                Pet name
                <input
                  name="petName"
                  value={form.petName}
                  onChange={change}
                  required
                  style={iStyle}
                />
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ flex: 1 }}>
                  Size
                  <select name="size" value={form.size} onChange={change} style={iStyle}>
                    <option>Small</option>
                    <option>Medium</option>
                    <option>Large</option>
                  </select>
                </label>

                <label style={{ flex: 1 }}>
                  Service
                  <select name="service" value={form.service} onChange={change} style={iStyle}>
                    {SERVICES.map(s => (
                      <option key={s.key}>{s.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ flex: 1 }}>
                  Date
                  <input type="date" name="date" value={form.date} onChange={change} required style={iStyle} />
                </label>
                <label style={{ flex: 1 }}>
                  Time
                  <input type="time" name="time" value={form.time} onChange={change} required style={iStyle} />
                </label>
              </div>

              <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                <legend style={{ padding: '0 6px', color: '#6b7280', fontSize: 12 }}>Add-ons</legend>
                <div style={{ display: 'grid', gap: 8 }}>
                  {ADDONS.map(a => (
                    <label key={a.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{a.label}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>${a.price.toFixed(2)}</span>
                        <input
                          type="checkbox"
                          checked={!!addonState[a.key]}
                          onChange={() => toggleAddon(a.key)}
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label>
                Notes (optional)
                <textarea name="notes" value={form.notes} onChange={change} rows={3} style={iStyle} />
              </label>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #0f4c8a',
                  background: submitting ? '#9ca3af' : '#197fe0',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: submitting ? 'default' : 'pointer',
                }}
              >
                {submitting ? 'Submitting…' : 'Request booking'}
              </button>

              {ok && <div style={{ color: '#065f46', marginTop: 8 }}>{ok}</div>}
              {err && <div style={{ color: '#b91c1c', marginTop: 8 }}>{err}</div>}
            </div>
          </div>
        </form>

        {/* Right: live summary */}
        <aside style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, height: 'fit-content', boxShadow: '0 10px 30px -12px rgba(0,0,0,.15)' }}>
          <div style={{ padding: '14px 16px', background: '#f0f7ff', color: '#0f4c8a', fontWeight: 700, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            Summary
          </div>
          <div style={{ padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{form.petName || 'Your pet'}</div>
            <div style={{ color: '#6b7280', fontSize: 14 }}>
              {form.service} • {form.size}
            </div>

            <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 8, paddingTop: 8 }}>
              {items.map((li, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span>{li.label}</span>
                  <span>${li.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid #e5e7eb', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Total</span>
              <span>${grand.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

const iStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 10,
  marginTop: 6,
  border: '1px solid #e5e7eb',
  borderRadius: 10,
};
