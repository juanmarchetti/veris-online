import { describe, it, expect } from 'vitest';
import { estaEnVentanaDeConexion, estaCitaExpirada } from './validaciones-videoconsulta';

describe('estaEnVentanaDeConexion', () => {
  it('debe retornar true si faltan exactamente 3 minutos', () => {
    // Definimos una hora base en UTC
    const ahora = new Date('2026-07-07T12:00:00.000Z');
    // Cita 3 minutos en el futuro (12:03:00)
    const cita = new Date('2026-07-07T12:03:00.000Z');
    expect(estaEnVentanaDeConexion(cita, 60, ahora)).toBe(true);
  });

  it('debe retornar false si faltan 3 minutos y 1 segundo (3:01)', () => {
    const ahora = new Date('2026-07-07T12:00:00.000Z');
    // Cita a las 12:03:01
    const cita = new Date('2026-07-07T12:03:01.000Z');
    expect(estaEnVentanaDeConexion(cita, 60, ahora)).toBe(false);
  });

  it('debe retornar false si faltan 4 minutos', () => {
    const ahora = new Date('2026-07-07T12:00:00.000Z');
    // Cita a las 12:04:00
    const cita = new Date('2026-07-07T12:04:00.000Z');
    expect(estaEnVentanaDeConexion(cita, 60, ahora)).toBe(false);
  });

  it('debe retornar true si falta 1 minuto', () => {
    const ahora = new Date('2026-07-07T12:00:00.000Z');
    // Cita a las 12:01:00
    const cita = new Date('2026-07-07T12:01:00.000Z');
    expect(estaEnVentanaDeConexion(cita, 60, ahora)).toBe(true);
  });

  it('debe retornar true si la cita ya pasó (reconexión)', () => {
    const ahora = new Date('2026-07-07T12:05:00.000Z');
    // Cita fue a las 12:00:00
    const cita = new Date('2026-07-07T12:00:00.000Z');
    expect(estaEnVentanaDeConexion(cita, 60, ahora)).toBe(true);
  });

  it('debe retornar true si la reconexión es razonable (1h 59min después del fin de cita de 60min)', () => {
    // Cita: 12:00, duracion 60 -> Termina 13:00. Limite es 15:00.
    // 1h59m después del inicio es 13:59. El test dice "después de la cita", o sea 1h59m después del FIN de la cita (14:59).
    const ahora = new Date('2026-07-07T14:59:00.000Z');
    const cita = new Date('2026-07-07T12:00:00.000Z');
    expect(estaEnVentanaDeConexion(cita, 60, ahora)).toBe(true);
    expect(estaCitaExpirada(cita, 60, ahora)).toBe(false);
  });

  it('debe retornar false si pasó el límite de reconexión (2h 1min después del fin de cita de 60min)', () => {
    // Cita: 12:00, duracion 60. Límite es 15:00.
    // 2h1m después de los 60min es 15:01.
    const ahora = new Date('2026-07-07T15:01:00.000Z');
    const cita = new Date('2026-07-07T12:00:00.000Z');
    expect(estaEnVentanaDeConexion(cita, 60, ahora)).toBe(false);
    expect(estaCitaExpirada(cita, 60, ahora)).toBe(true);
  });
});
