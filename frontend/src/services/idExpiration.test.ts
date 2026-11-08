import { describe, expect, it } from 'vitest';
import { idExpiration, expirationDateLabel } from './idExpiration';

describe('vencimiento del ID por día de calendario de Nueva York', () => {
  const now = new Date('2026-11-08T17:00:00Z');
  it('avisa desde siete días antes, incluyendo hoy y fechas vencidas', () => {
    expect(idExpiration('2026-11-16', now).needsUpdate).toBe(false);
    expect(idExpiration('2026-11-15', now).label).toContain('7 días');
    expect(idExpiration('2026-11-09', now).label).toContain('1 día:');
    expect(idExpiration('2026-11-08', now).label).toContain('vence hoy');
    expect(idExpiration('2026-11-07', now).label).toContain('vencido');
    expect(idExpiration(null, now).needsUpdate).toBe(false);
  });
  it('no adelanta el día por UTC y cuenta días durante el cambio de horario', () => {
    expect(idExpiration('2026-11-08', new Date('2026-11-09T02:00:00Z')).label).toContain(
      'vence hoy',
    );
    expect(idExpiration('2026-11-08', new Date('2026-11-01T16:00:00Z')).label).toContain('7 días');
    expect(expirationDateLabel('2026-11-08T00:00:00Z')).toBe('08/11/2026');
  });
});
