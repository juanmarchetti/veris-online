import { describe, it, expect } from 'vitest';
import { estaEnVentanaDeConexion } from './validaciones-videoconsulta';

describe('estaEnVentanaDeConexion', () => {
  it('debe retornar true si faltan exactamente 3 minutos', () => {
    // Definimos una hora base en UTC
    const ahora = new Date('2026-07-07T12:00:00.000Z');
    // Cita 3 minutos en el futuro (12:03:00)
    const cita = new Date('2026-07-07T12:03:00.000Z');
    expect(estaEnVentanaDeConexion(cita, ahora)).toBe(true);
  });

  it('debe retornar false si faltan 3 minutos y 1 segundo (3:01)', () => {
    const ahora = new Date('2026-07-07T12:00:00.000Z');
    // Cita a las 12:03:01
    const cita = new Date('2026-07-07T12:03:01.000Z');
    expect(estaEnVentanaDeConexion(cita, ahora)).toBe(false);
  });

  it('debe retornar false si faltan 4 minutos', () => {
    const ahora = new Date('2026-07-07T12:00:00.000Z');
    // Cita a las 12:04:00
    const cita = new Date('2026-07-07T12:04:00.000Z');
    expect(estaEnVentanaDeConexion(cita, ahora)).toBe(false);
  });

  it('debe retornar true si falta 1 minuto', () => {
    const ahora = new Date('2026-07-07T12:00:00.000Z');
    // Cita a las 12:01:00
    const cita = new Date('2026-07-07T12:01:00.000Z');
    expect(estaEnVentanaDeConexion(cita, ahora)).toBe(true);
  });

  it('debe retornar true si la cita ya pasó (reconexión)', () => {
    const ahora = new Date('2026-07-07T12:05:00.000Z');
    // Cita fue a las 12:00:00
    const cita = new Date('2026-07-07T12:00:00.000Z');
    expect(estaEnVentanaDeConexion(cita, ahora)).toBe(true);
  });
});
