export function idExpiration(value?: string | null, now = new Date()) {
  if (!value) return { label: 'Sin fecha registrada', className: '', needsUpdate: false };
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  const today = Date.parse(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`);
  const days = Math.round((Date.parse(value.slice(0, 10) + 'T00:00:00Z') - today) / 86400000);
  if (days < 0)
    return { label: 'ID vencido: debe actualizarlo', className: 'voided', needsUpdate: true };
  if (days === 0)
    return { label: 'El ID vence hoy: debe actualizarlo', className: 'pending', needsUpdate: true };
  if (days <= 7)
    return {
      label: `El ID vence en ${days} ${days === 1 ? 'día' : 'días'}: debe actualizarlo`,
      className: 'pending',
      needsUpdate: true,
    };
  return { label: 'ID vigente', className: 'active', needsUpdate: false };
}

export function expirationDateLabel(value?: string | null) {
  if (!value) return 'Sin fecha registrada';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
