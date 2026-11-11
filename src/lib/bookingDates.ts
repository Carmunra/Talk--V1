export function bookingDates(now = new Date()) {
  const zone = { timeZone: 'America/Sao_Paulo' };
  const dateFormat = new Intl.DateTimeFormat('sv-SE', zone);
  const today = new Date(dateFormat.format(now) + 'T12:00:00Z');
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() + index + 1);
    const dayName = date.toLocaleDateString('pt-BR', { ...zone, weekday: 'short' });
    const dayMonth = date.toLocaleDateString('pt-BR', {
      ...zone,
      day: '2-digit',
      month: '2-digit',
    });
    return {
      dateStr: dateFormat.format(date),
      label: `${dayName}, ${dayMonth}`,
      dayOfWeek: date.getUTCDay(),
    };
  });
}
