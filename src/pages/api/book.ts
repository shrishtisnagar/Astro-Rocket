export const prerender = false;

import type { APIRoute } from 'astro';
import { createMeetEvent } from '@/lib/google-calendar';

function padded(n: number) {
  return n.toString().padStart(2, '0');
}

/** Builds a local datetime string understood by Google Calendar API */
function toLocalDateTimeString(dateStr: string, timeStr: string): string {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
  return `${dateStr}T${timeStr}:00`;
}

function addMinutes(localDT: string, minutes: number): string {
  const [datePart, timePart] = localDT.split('T');
  const [h, m] = timePart.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${datePart}T${padded(newH)}:${padded(newM)}:00`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { date, time, name, email, productTitle, duration, timezone } =
      (await request.json()) as {
        date: string;
        time: string;
        name: string;
        email: string;
        productTitle: string;
        duration: number;
        timezone: string;
      };

    if (!date || !time || !name || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const startLocal = toLocalDateTimeString(date, time);
    const endLocal = addMinutes(startLocal, duration ?? 60);

    const result = await createMeetEvent({
      title: `${productTitle} with ${name}`,
      startLocal,
      endLocal,
      timeZone: timezone ?? 'Asia/Kolkata',
      attendeeEmail: email,
      attendeeName: name,
      description: `Session booked via thescurve.in`,
    });

    return new Response(
      JSON.stringify({ success: true, meetLink: result.meetLink, eventId: result.eventId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Booking failed';
    console.error('[/api/book]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
