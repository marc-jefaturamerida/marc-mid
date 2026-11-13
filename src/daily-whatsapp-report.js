
/** WhatsApp del comparativo diario. */
export const DAILY_WHATSAPP_LABELS = Object.freeze([
  ['records', 'Registro'],
  ['sales', 'Ventas'],
  ['reg', 'Regular'],
  ['guar', 'Garantia'],
  ['p0', 'P Cero'],
  ['dental', 'P Dental']
]);

const numberFmt = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 2
});

const fmtCount = value => numberFmt.format(value);

const fmtPct = value =>
  Number.isFinite(value)
    ? `${numberFmt.format(value)}%`
    : '—';

const fmtDate = iso => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    String(iso || '')
  );
  return match
    ? `${match[3]}/${match[2]}/${match[1]}`
    : String(iso || '—');
};

const fmtDelta = (value, previous, asPoints = false) => {
  if (!Number.isFinite(value) || !Number.isFinite(previous)) {
    return '(—)';
  }

  const difference = Number(
    (value - previous).toFixed(asPoints ? 2 : 0)
  );

  const prefix = difference > 0 ? '+' : '';

  return `(${prefix}${numberFmt.format(difference)}${asPoints ? ' pp' : ''})`;
};

/** Genera el mensaje listo para WhatsApp. */
export function buildDailyWhatsAppReport({
  currentDate,
  previousDate,
  current,
  previous,
  currentQuality,
  previousQuality,
  todayIso
}) {
  if (
    !currentDate ||
    !previousDate ||
    currentDate === previousDate ||
    !current ||
    !previous
  ) {
    throw new Error(
      'Selecciona dos fechas distintas e importa registros antes de copiar.'
    );
  }

  const today = new Date(`${todayIso || currentDate}T12:00:00`);

  if (Number.isNaN(today.getTime())) {
    throw new Error('Fecha principal no válida.');
  }

  today.setDate(today.getDate() - 1);

  const yesterdayIso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  const isTodayVsYesterday =
    currentDate === todayIso &&
    previousDate === yesterdayIso;

  const heading = isTodayVsYesterday
    ? 'Reporte general de hoy versus ayer.'
    : `Reporte general del ${fmtDate(currentDate)} versus ${fmtDate(previousDate)}.`;

  const rows = DAILY_WHATSAPP_LABELS.map(([key, label]) => ({
    label,
    value: fmtCount(current[key] || 0),
    delta: fmtDelta(current[key] || 0, previous[key] || 0)
  }));

  rows.push({
    label: 'Calidad',
    value: fmtPct(currentQuality),
    delta: fmtDelta(currentQuality, previousQuality, true)
  });

  // Ancho fijo de 8 caracteres para los factores.
  const labelWidth = 8;

  // Ancho automático para las cantidades.
  const valueWidth = Math.max(
    ...rows.map(row => row.value.length)
  );

  // Dos espacios entre columnas.
  const lines = rows.map(row =>
    `${row.label.padEnd(labelWidth)}  ${row.value.padEnd(valueWidth)}  ${row.delta}`
  );

  return `*${heading}*\n\n\`\`\`\n${lines.join('\n')}\n\`\`\``;
}
