import { createSign } from 'node:crypto';

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) throw new Error('Google Calendar credentials not configured. See .env.example.');

  const privateKey = rawKey.replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  ).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(privateKey, 'base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${payload}.${sig}`,
    }),
  });

  const { access_token, error } = (await res.json()) as { access_token?: string; error?: string };
  if (!access_token) throw new Error(`Token exchange failed: ${error}`);
  return access_token;
}

export interface BookingParams {
  title: string;
  /** Local date+time string, e.g. "2025-06-12T14:00:00" */
  startLocal: string;
  /** Local date+time string, e.g. "2025-06-12T15:00:00" */
  endLocal: string;
  timeZone: string;
  attendeeEmail: string;
  attendeeName: string;
  description?: string;
}

export interface BookingResult {
  eventId: string;
  meetLink: string | null;
  htmlLink: string;
}

export async function createMeetEvent(params: BookingParams): Promise<BookingResult> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID not set. See .env.example.');

  const token = await getAccessToken();

  const body = {
    summary: params.title,
    description: params.description ?? '',
    start: { dateTime: params.startLocal, timeZone: params.timeZone },
    end: { dateTime: params.endLocal, timeZone: params.timeZone },
    attendees: [{ email: params.attendeeEmail, displayName: params.attendeeName }],
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Calendar API error: ${JSON.stringify(err)}`);
  }

  const data = (await res.json()) as {
    id: string;
    htmlLink: string;
    conferenceData?: { entryPoints?: Array<{ entryPointType: string; uri: string }> };
  };

  const meetLink =
    data.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ?? null;

  return { eventId: data.id, meetLink, htmlLink: data.htmlLink };
}
