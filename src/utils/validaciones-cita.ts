// src/utils/validaciones-cita.ts
// Lógica de validación de citas extraída como funciones puras para facilitar testing.

export type ValidacionCitaInput = {
  hora: string
  fecha: string
}

/**
 * Valida el rango horario (08:00 - 17:30) y bloques de 30 minutos.
 * Retorna null si la validación pasa, o un string de error si falla.
 */
export function validarHoraCita(hora: string): string | null {
  const parts = hora.split(':')
  if (parts.length !== 2) return 'Formato de hora inválido.'

  const hour = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)

  if (isNaN(hour) || isNaN(minutes)) return 'Formato de hora inválido.'

  if (minutes !== 0 && minutes !== 30) {
    return 'Las citas deben agendarse en bloques de 30 minutos (ej. 08:00, 08:30).'
  }

  return null
}

/**
 * Valida que la fecha no sea pasada.
 */
export function validarFechaFutura(fecha: Date, ahora: Date = new Date()): string | null {
  if (fecha <= ahora) {
    return 'No puedes agendar una cita en el pasado.'
  }
  return null
}
