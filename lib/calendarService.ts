import { getAccessToken } from './driveService';

export interface CreateMeetingParams {
  title: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm
  duration: number;    // minutes
  notes?: string;
  attendeeEmail?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  meetLink: string;
  htmlLink: string;
}

export const createCalendarMeeting = async (
  params: CreateMeetingParams
): Promise<GoogleCalendarEvent> => {
  const token = await getAccessToken();

  const startDateTime = new Date(`${params.date}T${params.time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + params.duration * 60000);

  const toISO = (d: Date) => d.toISOString();

  const event: any = {
    summary: params.title,
    description: params.notes || '',
    start: {
      dateTime: toISO(startDateTime),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: toISO(endDateTime),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    conferenceData: {
      createRequest: {
        requestId: `visual-oscart-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  if (params.attendeeEmail) {
    event.attendees = [{ email: params.attendeeEmail }];
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'Error al crear el evento en Google Calendar');
  }

  const data = await response.json();
  const meetLink = data.conferenceData?.entryPoints?.find(
    (ep: any) => ep.entryPointType === 'video'
  )?.uri || '';

  return {
    id: data.id,
    meetLink,
    htmlLink: data.htmlLink,
  };
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  const token = await getAccessToken();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error('Error al eliminar el evento de Google Calendar');
  }
};
