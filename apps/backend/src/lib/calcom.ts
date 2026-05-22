const CAL_API_BASE = 'https://api.cal.com/v2';

export type CalSlot = {
  startTime: string;
};

export async function getAvailableSlots({
  calApiKey,
  eventTypeId,
  startDate,
  endDate,
  timezone,
}: {
  calApiKey: string;
  eventTypeId: number;
  startDate: string;
  endDate: string;
  timezone?: string;
}): Promise<{ slots: CalSlot[] }> {
  const params = new URLSearchParams({
    eventTypeId: String(eventTypeId),
    startTime: startDate,
    endTime: endDate,
    ...(timezone ? { timeZone: timezone } : {}),
  });

  const res = await fetch(`${CAL_API_BASE}/slots/available?${params}`, {
    headers: {
      Authorization: `Bearer ${calApiKey}`,
      'cal-api-version': '2024-09-04',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal.com slots error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    data: { slots: Record<string, { time: string }[]> };
  };

  const flat: CalSlot[] = Object.values(data.data.slots)
    .flat()
    .map((s) => ({ startTime: s.time }));

  return { slots: flat };
}

export type CalBookingResult = {
  uid: string;
  startTime: string;
};

export async function createBooking({
  calApiKey,
  eventTypeId,
  startTime,
  attendeeName,
  attendeeEmail,
  notes,
  timezone,
}: {
  calApiKey: string;
  eventTypeId: number;
  startTime: string;
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
  timezone: string;
}): Promise<CalBookingResult> {
  const res = await fetch(`${CAL_API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${calApiKey}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
    },
    body: JSON.stringify({
      eventTypeId,
      start: startTime,
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        timeZone: timezone,
      },
      ...(notes ? { metadata: { notes } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal.com booking error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { data: { uid: string; start: string } };
  return { uid: data.data.uid, startTime: data.data.start };
}
