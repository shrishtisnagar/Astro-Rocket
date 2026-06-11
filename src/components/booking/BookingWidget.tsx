import { useState, useMemo, useRef } from 'react';

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeeklySchedule {
  timezone: string;
  daysAhead: number;
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
  saturday: string[];
  sunday: string[];
}

interface Props {
  productSlug: string;
  productTitle: string;
  duration: number;
  price: string;
  originalPrice?: string;
  schedule: WeeklySchedule;
}

const DAY_KEYS: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getAvailableDates(schedule: WeeklySchedule): Array<{ date: Date; slots: string[] }> {
  const result: Array<{ date: Date; slots: string[] }> = [];
  const today = new Date();
  for (let i = 1; i <= (schedule.daysAhead || 14); i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = DAY_KEYS[d.getDay()];
    const slots = schedule[key] ?? [];
    if (slots.length > 0) result.push({ date: d, slots: [...slots].sort() });
  }
  return result;
}

function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateLabel(d: Date): string {
  return `${DAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

const BG = '#0f0508';
const SURFACE = '#1a0810';
const BORDER = 'rgba(255,255,255,0.09)';
const BORDER_HOVER = 'rgba(255,255,255,0.18)';
const BRAND = 'oklch(81% 0.090 17)';
const BRAND_DIM = 'oklch(81% 0.090 17 / 0.15)';
const TEXT = 'rgba(255,255,255,0.90)';
const MUTED = 'rgba(255,255,255,0.42)';
const GREEN = 'oklch(75% 0.15 145)';
const GREEN_BG = 'oklch(15% 0.05 145 / 0.35)';

export default function BookingWidget({ productSlug, productTitle, duration, price, originalPrice, schedule }: Props) {
  const availableDates = useMemo(() => getAvailableDates(schedule), [schedule]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const dateRowRef = useRef<HTMLDivElement>(null);

  const selected = selectedIdx !== null ? availableDates[selectedIdx] : null;
  const canBook = selected && selectedSlot && name.trim().length >= 2 && email.includes('@') && email.includes('.');

  async function handleBook() {
    if (!selected || !selectedSlot) return;
    setStatus('loading');
    setErrorMsg('');

    const dateStr = [
      selected.date.getFullYear(),
      String(selected.date.getMonth() + 1).padStart(2, '0'),
      String(selected.date.getDate()).padStart(2, '0'),
    ].join('-');

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          time: selectedSlot,
          name: name.trim(),
          email: email.trim(),
          productTitle,
          productSlug,
          duration,
          timezone: schedule.timezone,
        }),
      });
      const data = (await res.json()) as { success?: boolean; meetLink?: string; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Booking failed');
      setMeetLink(data.meetLink ?? null);
      setStatus('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  /* ── Success state ── */
  if (status === 'success') {
    return (
      <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: 36, height: 36, borderRadius: '50%', background: GREEN_BG, border: `1px solid ${GREEN}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREEN, fontSize: 18, flexShrink: 0 }}>✓</span>
          <div>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: TEXT }}>You're booked!</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: MUTED }}>{formatDateLabel(selected!.date)} · {to12h(selectedSlot!)} · {schedule.timezone}</p>
          </div>
        </div>

        {meetLink ? (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Google Meet link</p>
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: BRAND, fontWeight: 600, fontSize: '0.95rem', wordBreak: 'break-all', textDecoration: 'none' }}
            >
              {meetLink}
            </a>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.85rem', color: MUTED }}>A Google Meet link will arrive in your confirmation email shortly.</p>
        )}

        <p style={{ margin: 0, fontSize: '0.82rem', color: MUTED }}>
          Check your email <strong style={{ color: TEXT }}>{email}</strong> for the calendar invite and join link.
        </p>

        <button
          onClick={() => { setStatus('idle'); setSelectedIdx(null); setSelectedSlot(null); setName(''); setEmail(''); setMeetLink(null); }}
          style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0.6rem 1rem', color: MUTED, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          Book another slot
        </button>
      </div>
    );
  }

  /* ── Main widget ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Price header */}
      <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '16px 16px 0 0', padding: '1.25rem 1.5rem', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: TEXT, letterSpacing: '-0.03em' }}>{price}</span>
          {originalPrice && (
            <s style={{ fontSize: '1rem', color: MUTED, textDecoration: 'line-through', fontWeight: 500 }}>{originalPrice}</s>
          )}
        </div>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: MUTED, lineHeight: 1.5 }}>
          Pick a date and time below — your Google Meet link is created instantly.
        </p>
      </div>

      {/* Booking card */}
      <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '0 0 16px 16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Date row */}
        <div>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            When should we meet?
          </p>
          <div
            ref={dateRowRef}
            style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}
          >
            {availableDates.length === 0 ? (
              <p style={{ color: MUTED, fontSize: '0.85rem', margin: 0 }}>No available dates — check back soon.</p>
            ) : availableDates.map((d, i) => {
              const isSelected = selectedIdx === i;
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedIdx(i); setSelectedSlot(null); }}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    padding: '0.7rem 0.9rem',
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? BRAND : BORDER}`,
                    background: isSelected ? BRAND_DIM : SURFACE,
                    color: isSelected ? BRAND : TEXT,
                    cursor: 'pointer',
                    minWidth: 72,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isSelected ? BRAND : MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {DAY_SHORT[d.date.getDay()]}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.1 }}>{d.date.getDate()}</span>
                  <span style={{ fontSize: '0.68rem', color: isSelected ? BRAND : MUTED }}>{MONTH_SHORT[d.date.getMonth()]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selected && (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Select time of day
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selected.slots.map((slot) => {
                const isActive = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: 10,
                      border: `1.5px solid ${isActive ? BRAND : BORDER}`,
                      background: isActive ? BRAND_DIM : SURFACE,
                      color: isActive ? BRAND : TEXT,
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    {to12h(slot)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact fields — reveal after slot selected */}
        {selectedSlot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ height: 1, background: BORDER }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                style={{
                  background: SURFACE,
                  border: `1px solid ${name.length >= 2 ? BORDER_HOVER : BORDER}`,
                  borderRadius: 10,
                  padding: '0.7rem 1rem',
                  color: TEXT,
                  fontSize: '0.9rem',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                style={{
                  background: SURFACE,
                  border: `1px solid ${email.includes('@') ? BORDER_HOVER : BORDER}`,
                  borderRadius: 10,
                  padding: '0.7rem 1rem',
                  color: TEXT,
                  fontSize: '0.9rem',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {status === 'error' && (
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'oklch(65% 0.22 25)', background: 'oklch(18% 0.05 25 / 0.5)', border: '1px solid oklch(65% 0.22 25 / 0.3)', borderRadius: 8, padding: '0.6rem 0.9rem' }}>
                {errorMsg}
              </p>
            )}

            <button
              onClick={handleBook}
              disabled={!canBook || status === 'loading'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                background: canBook && status !== 'loading' ? BRAND : 'rgba(255,255,255,0.08)',
                color: canBook && status !== 'loading' ? BG : MUTED,
                border: 'none',
                borderRadius: 12,
                padding: '0.9rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: canBook && status !== 'loading' ? 'pointer' : 'not-allowed',
                transition: 'background 0.18s, color 0.18s',
                letterSpacing: '-0.01em',
              }}
            >
              {status === 'loading' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Creating your booking…
                </>
              ) : (
                <>
                  Confirm booking
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* Summary pill */}
        {selected && selectedSlot && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 9999, padding: '0.4rem 0.85rem', width: 'fit-content', fontSize: '0.78rem', color: MUTED }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {formatDateLabel(selected.date)} · {to12h(selectedSlot)} · {duration} min
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.22); }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
