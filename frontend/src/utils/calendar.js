// Build and download an .ics calendar file for a booking — works with
// Google Calendar, Apple Calendar, Outlook, etc.

const pad = (n) => String(n).padStart(2, '0')

// Format a Date as UTC iCalendar timestamp: YYYYMMDDTHHMMSSZ
const icsDate = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
  `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`

const escapeText = (s = '') =>
  String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

export function downloadBookingICS(booking, session) {
  const start = new Date(booking.sessionDate)
  // sessionDate may be midnight — apply the HH:MM from sessionTime if present
  if (booking.sessionTime) {
    const [h, m] = booking.sessionTime.split(':')
    if (!isNaN(parseInt(h))) start.setHours(parseInt(h), parseInt(m) || 0, 0, 0)
  }
  const end = new Date(start.getTime() + (session?.duration || 60) * 60 * 1000)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YogaFlow//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.bookingReference || booking._id}@yogaflow`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeText(`🧘 ${session?.title || 'Yoga Session'}`)}`,
    `DESCRIPTION:${escapeText(
      `Booking ref: ${booking.bookingReference || '—'}` +
      (session?.instructor?.name ? `\nInstructor: ${session.instructor.name}` : '') +
      (session?.level ? `\nLevel: ${session.level}` : '')
    )}`,
    `LOCATION:${escapeText(session?.location?.address || 'YogaFlow Studio')}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Yoga session in 2 hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `yogaflow-${booking.bookingReference || 'booking'}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
