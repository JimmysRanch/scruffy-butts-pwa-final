'use client';
import React, { useMemo, useState } from 'react';

type SizeKey = 'small' | 'medium' | 'large' | 'giant';
type ServiceKey = 'basicBath' | 'basicGroom' | 'deluxeGroom' | 'deluxeSpa';

const SIZE_LABELS: Record<SizeKey, string> = {
  small: 'Small (1–25 lbs)',
  medium: 'Medium (26–50 lbs)',
  large: 'Large (51–80 lbs)',
  giant: 'Giant (81+ lbs)',
};

const SERVICES: Record<ServiceKey, {
  label: string;
  prices: Record<SizeKey, number>;
  includes: string[];
}> = {
  basicBath: {
    label: 'Basic Bath',
    includes: ['Shampoo', 'Blow Out', 'Brush Out', 'Ear Cleaning', 'Nail Trim'],
    prices: { small: 30, medium: 35, large: 40, giant: 45 },
  },
  basicGroom: {
    label: 'Basic Groom',
    includes: ['Bath + Round Out Paws', 'Neaten Face', 'Sanitary Trim'],
    prices: { small: 50, medium: 60, large: 70, giant: 80 },
  },
  deluxeGroom: {
    label: 'Deluxe Groom',
    includes: ['Basic Groom +', 'Custom Haircut'],
    prices: { small: 60, medium: 70, large: 80, giant: 90 },
  },
  deluxeSpa: {
    label: 'Deluxe Spa & Groom',
    includes: ['Deluxe Groom + Spa Add-Ons'],
    prices: { small: 70, medium: 80, large: 90, giant: 100 },
  },
};

// ---------- Add-ons (now includes Matting fee) ----------
type AddonKey =
  | 'matting'
  | 'blueberry'
  | 'deshedding'
  | 'conditioning'
  | 'pawpad'
  | 'teeth'
  | 'nailfile';

const ADDONS: Record<AddonKey, {
  label: string;
  prices: Record<SizeKey, number>;
}> = {
  matting: {
    label: 'Matting fee',
    prices: { small: 10, medium: 20, large: 30, giant: 40 },
  },
  blueberry: {
    label: 'Blueberry Facial',
    prices: { small: 10, medium: 10, large: 10, giant: 10 },
  },
  deshedding: {
    label: 'Deshedding',
    prices: { small: 15, medium: 20, large: 25, giant: 30 },
  },
  conditioning: {
    label: 'Conditioning Treatment + Massage',
    prices: { small: 10, medium: 15, large: 20, giant: 25 },
  },
  pawpad: {
    label: 'Paw Pad Cream',
    prices: { small: 5, medium: 5, large: 5, giant: 5 },
  },
  teeth: {
    label: 'Teeth Brushing',
    prices: { small: 10, medium: 10, large: 10, giant: 10 },
  },
  nailfile: {
    label: 'Nail File',
    prices: { small: 5, medium: 5, large: 5, giant: 5 },
  },
};

type DogRow = {
  id: string;
  name: string;
  size: SizeKey;
  service: ServiceKey;
  addons: Partial<Record<AddonKey, boolean>>;
};

const blankDog = (n: number): DogRow => ({
  id: `${Date.now()}-${n}`,
  name: '',
  size: 'small',
  service: 'basicBath',
  addons: {},
});

export default function BookPage() {
  // Owner & appointment (shared)
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Dogs
  const [dogs, setDogs] = useState<DogRow[]>([blankDog(1)]);

  function addDog() {
    if (dogs.length >= 4) return;
    setDogs(prev => [...prev, blankDog(prev.length + 1)]);
  }
  function removeDog(id: string) {
    setDogs(prev => prev.filter(d => d.id !== id));
  }
  function updateDog(id: string, patch: Partial<DogRow>) {
    setDogs(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
  }
  function toggleAddon(id: string, key: AddonKey) {
    setDogs(prev => prev.map(d => {
      if (d.id !== id) return d;
      const next = { ...(d.addons || {}) };
      next[key] = !next[key];
      return { ...d, addons: next };
    }));
  }

  // Per-dog totals
  const perDogTotals = useMemo(() => {
    return dogs.map(d => {
      const base = SERVICES[d.service].prices[d.size];
      const addonSum = (Object.keys(d.addons || {}) as AddonKey[])
        .filter(k => d.addons?.[k])
        .reduce((sum, k) => sum + ADDONS[k].prices[d.size], 0);
      return base + addonSum;
    });
  }, [dogs]);

  const grandTotal = useMemo(
    () => perDogTotals.reduce((a, b) => a + b, 0),
    [perDogTotals]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(
      [
        'Request received:',
        `When: ${date} ${time}`,
        `Owner: ${ownerName} — ${phone}${email ? ' / ' + email : ''}`,
        ...dogs.map((d, i) => {
          const addonsPicked = (Object.keys(d.addons || {}) as AddonKey[])
            .filter(k => d.addons?.[k])
            .map(k => `${ADDONS[k].label} ($${ADDONS[k].prices[d.size]})`);
          return `Dog ${i + 1}: ${d.name || '(no name)'} — ${SERVICES[d.service].label}, ${SIZE_LABELS[d.size]} | Add-ons: ${addonsPicked.join(', ') || 'None'} | Subtotal: $${perDogTotals[i]}`;
        }),
        `Grand Total: $${grandTotal}`,
      ].join('\n')
    );
    // Later: POST to /api/book for Twilio/email + storage.
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">Book an appointment</h1>
      <p className="mb-6 text-sm opacity-70">Add up to four dogs for the same time slot. Prices update automatically.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Owner & time */}
        <section className="rounded-lg border p-4 bg-white shadow-sm space-y-3">
          <h2 className="font-semibold text-lg">Owner & Appointment</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input required className="border rounded p-2" placeholder="Owner name"
              value={ownerName} onChange={e => setOwnerName(e.target.value)} />
            <input required className="border rounded p-2" placeholder="Phone" inputMode="tel"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <input className="border rounded p-2 w-full" placeholder="Email (optional)" type="email"
            value={email} onChange={e => setEmail(e.target.value)} />
          <div className="grid md:grid-cols-2 gap-3">
            <input required className="border rounded p-2" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <input required className="border rounded p-2" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </section>

        {/* Dogs */}
        <section className="rounded-lg border p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Dogs</h2>
            <button type="button"
              onClick={addDog}
              disabled={dogs.length >= 4}
              className="rounded-full px-4 py-2 bg-blue-600 text-white disabled:opacity-50">
              + Add dog ({dogs.length}/4)
            </button>
          </div>

          <div className="space-y-4">
            {dogs.map((d, idx) => {
              const base = SERVICES[d.service].prices[d.size];
              const addonSum = (Object.keys(d.addons || {}) as AddonKey[])
                .filter(k => d.addons?.[k])
                .reduce((sum, k) => sum + ADDONS[k].prices[d.size], 0);
              const subtotal = base + addonSum;

              return (
                <div key={d.id} className="rounded border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Dog {idx + 1}</div>
                    {dogs.length > 1 && (
                      <button type="button" onClick={() => removeDog(d.id)}
                        className="text-sm px-2 py-1 rounded border">
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <input className="border rounded p-2" placeholder="Dog name"
                      value={d.name} onChange={e => updateDog(d.id, { name: e.target.value })} />

                    <select className="border rounded p-2"
                      value={d.size}
                      onChange={e => updateDog(d.id, { size: e.target.value as SizeKey })}>
                      {(Object.keys(SIZE_LABELS) as SizeKey[]).map(k =>
                        <option key={k} value={k}>{SIZE_LABELS[k]}</option>
                      )}
                    </select>

                    <select className="border rounded p-2"
                      value={d.service}
                      onChange={e => updateDog(d.id, { service: e.target.value as ServiceKey })}>
                      {(Object.keys(SERVICES) as ServiceKey[]).map(k =>
                        <option key={k} value={k}>{SERVICES[k].label}</option>
                      )}
                    </select>
                  </div>

                  {/* Add-ons (now with Matting fee) */}
                  <div className="mt-3">
                    <h3 className="font-medium text-sm mb-2">Add-ons</h3>
                    <div className="grid md:grid-cols-2 gap-2">
                      {(Object.keys(ADDONS) as AddonKey[]).map(key => (
                        <label key={key} className="rounded border p-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={!!d.addons[key]}
                            onChange={() => toggleAddon(d.id, key)}
                          />
                          {ADDONS[key].label} — ${ADDONS[key].prices[d.size]}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="mt-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">Base price ({SERVICES[d.service].label}, {SIZE_LABELS[d.size]})</span>
                      <span>${base}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">Add-ons</span>
                      <span>${addonSum}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 border-t pt-2">
                      <span className="font-semibold">Subtotal</span>
                      <span className="font-semibold">${subtotal}</span>
                    </div>
                    <ul className="list-disc ml-5 mt-2 opacity-80">
                      {SERVICES[d.service].includes.map((i, j) => <li key={j}>{i}</li>)}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Grand total + submit */}
        <section className="rounded-lg border p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm opacity-70">Total for all dogs</p>
            <p className="text-2xl font-bold">${grandTotal}</p>
          </div>
          <button type="submit" className="rounded-full px-6 py-3 bg-blue-600 text-white font-semibold">
            Request Booking
          </button>
        </section>
      </form>

      <p className="mt-8 text-center text-xs opacity-70">
        © {new Date().getFullYear()} Scruffy Butts · Natalia, TX
      </p>
    </main>
  );
}
