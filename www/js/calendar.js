// BabyTrack Mobile — Generador Local de Google Calendar + Archivos .ics con Alarma 1 Día Antes
window.BabyCalendar = (() => {
  const TYPE_LABELS = {
    MEDICO: '🩺 Cita Médica',
    LABORATORIO: '🔬 Laboratorio',
    ECO: '👶 Ultrasonido (Eco)'
  };

  function toGoogleUtcStamp(dateObj) {
    return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  function toLocalCalStamp(isoStr) {
    const dt = new Date(isoStr);
    const pad = (n) => String(n).padStart(2, '0');
    return (
      dt.getFullYear() +
      pad(dt.getMonth() + 1) +
      pad(dt.getDate()) +
      'T' +
      pad(dt.getHours()) +
      pad(dt.getMinutes()) +
      '00'
    );
  }

  function buildGoogleCalendarUrl(appt, babyNickname = 'Nuestro Bebé') {
    const start = new Date(appt.appointmentDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const label = TYPE_LABELS[appt.appointmentType || 'MEDICO'] || '🩺 Cita Médica';
    const title = `${label}: ${appt.doctorOrClinic} · BabyTrack (${babyNickname})`;
    const details = [
      `Semana gestacional: ${appt.gestationalWeek} sem, ${appt.gestationalDay} días`,
      appt.specialty ? `Especialidad: ${appt.specialty}` : '',
      appt.questionsForDoctor ? `Notas / Estudios / Dudas:\n${appt.questionsForDoctor}` : '',
      'Recordatorio sugerido en Google Calendar: 1 día antes.'
    ].filter(Boolean).join('\n\n');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${toGoogleUtcStamp(start)}/${toGoogleUtcStamp(end)}`,
      details,
      location: appt.doctorOrClinic || ''
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function buildSingleIcs(appt, babyNickname = 'Nuestro Bebé') {
    const start = new Date(appt.appointmentDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const reminderMins = Number(appt.reminderMinutesBefore || 1440);
    const label = TYPE_LABELS[appt.appointmentType || 'MEDICO'] || '🩺 Cita';
    const summary = `${label} · ${appt.doctorOrClinic} (${babyNickname})`.replace(/[,;]/g, ' ');
    const desc = (appt.questionsForDoctor || 'Control prenatal BabyTrack').replace(/\n/g, '\\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BabyTrack Mobile//ES',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:babytrack-appt-${appt.id}@babytrack.app`,
      `DTSTAMP:${toGoogleUtcStamp(new Date())}`,
      `DTSTART:${toLocalCalStamp(start)}`,
      `DTEND:${toLocalCalStamp(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${(appt.doctorOrClinic || '').replace(/[,;]/g, ' ')}`,
      'BEGIN:VALARM',
      `TRIGGER:-PT${reminderMins}M`,
      'ACTION:DISPLAY',
      'DESCRIPTION:Recordatorio cuidadoso BabyTrack (1 día antes de tu cita)',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT120M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Tu cita prenatal es en 2 horas',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  async function downloadIcs(appt, babyNickname) {
    const content = buildSingleIcs(appt, babyNickname);
    const fileName = `cita-babytrack-${appt.id}.ics`;

    if (window.BabyNative && typeof window.BabyNative.exportTextFile === 'function') {
      return await window.BabyNative.exportTextFile({
        content,
        fileName,
        mimeType: 'text/calendar;charset=utf-8',
        title: `Cita BabyTrack · ${appt.doctorOrClinic || babyNickname || ''}`.trim(),
        text: `Recordatorio de cita prenatal (${appt.doctorOrClinic || 'BabyTrack'})`,
        dialogTitle: 'Agregar cita a tu Calendario o compartir (.ics)',
      });
    }

    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    if (typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, mode: 'web' };
  }

  return {
    buildGoogleCalendarUrl,
    buildSingleIcs,
    downloadIcs
  };
})();
