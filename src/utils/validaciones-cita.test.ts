import { describe, it, expect } from 'vitest'
import { validarHoraCita, validarDiaCita, validarFechaFutura } from '@/utils/validaciones-cita'

describe('validarHoraCita', () => {
  it('acepta horarios válidos dentro de rango (08:00 a 17:30)', () => {
    expect(validarHoraCita('08:00')).toBeNull()
    expect(validarHoraCita('08:30')).toBeNull()
    expect(validarHoraCita('12:00')).toBeNull()
    expect(validarHoraCita('12:30')).toBeNull()
    expect(validarHoraCita('17:00')).toBeNull()
    expect(validarHoraCita('17:30')).toBeNull()
  })

  it('rechaza horarios fuera de rango', () => {
    expect(validarHoraCita('07:00')).toContain('fuera del horario')
    expect(validarHoraCita('07:30')).toContain('fuera del horario')
    expect(validarHoraCita('18:00')).toContain('fuera del horario')
    expect(validarHoraCita('20:00')).toContain('fuera del horario')
  })

  it('rechaza 17:31 o posterior dentro de la hora 17', () => {
    // 17:31 no debería ser válido, y además no es bloque de 30
    // Pero el check de rango lo atrapa primero
    const result = validarHoraCita('17:31')
    expect(result).not.toBeNull()
  })

  it('rechaza minutos que no son bloques de 30', () => {
    expect(validarHoraCita('09:15')).toContain('bloques de 30 minutos')
    expect(validarHoraCita('10:45')).toContain('bloques de 30 minutos')
    expect(validarHoraCita('11:01')).toContain('bloques de 30 minutos')
  })

  it('rechaza formatos inválidos', () => {
    expect(validarHoraCita('abc')).toContain('Formato de hora inválido')
    expect(validarHoraCita('')).toContain('Formato de hora inválido')
  })
})

describe('validarDiaCita', () => {
  it('acepta lunes a sábado', () => {
    // 2026-07-06 es un lunes
    expect(validarDiaCita(new Date('2026-07-06T10:00:00'))).toBeNull()
    // 2026-07-07 es martes
    expect(validarDiaCita(new Date('2026-07-07T10:00:00'))).toBeNull()
    // 2026-07-11 es sábado
    expect(validarDiaCita(new Date('2026-07-11T10:00:00'))).toBeNull()
  })

  it('rechaza domingos', () => {
    // 2026-07-12 es domingo
    expect(validarDiaCita(new Date('2026-07-12T10:00:00'))).toContain('domingo')
  })
})

describe('validarFechaFutura', () => {
  it('acepta fechas futuras', () => {
    const ahora = new Date('2026-07-06T10:00:00')
    const futuro = new Date('2026-07-06T10:01:00')
    expect(validarFechaFutura(futuro, ahora)).toBeNull()
  })

  it('rechaza fechas pasadas', () => {
    const ahora = new Date('2026-07-06T10:00:00')
    const pasado = new Date('2026-07-06T09:59:00')
    expect(validarFechaFutura(pasado, ahora)).toContain('pasado')
  })

  it('rechaza fecha exactamente igual (no estrictamente futura)', () => {
    const ahora = new Date('2026-07-06T10:00:00')
    expect(validarFechaFutura(ahora, ahora)).toContain('pasado')
  })
})
