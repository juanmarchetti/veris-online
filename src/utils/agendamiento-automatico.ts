/**
 * agendamiento-automatico.ts
 * ============================================================
 * Módulo de agendamiento automático FIFO (First In, First Out).
 *
 * CRITERIO FIFO:
 *   Los días seleccionados por el paciente se recorren en orden cronológico
 *   ascendente. Dentro de cada día, los bloques horarios también se recorren
 *   en orden ascendente (de 08:00 → 17:00). Se devuelve el PRIMER bloque libre
 *   que se encuentre — esto garantiza FIFO real: el slot más temprano posible.
 *
 * FALLBACK AUTOMÁTICO:
 *   Si ninguno de los días elegidos tiene cupo con el médico solicitado,
 *   el sistema busca en los 14 días siguientes al último día seleccionado
 *   sin pedirle nada al paciente.
 *
 *   Si tampoco hay en esos 14 días, se busca en otros médicos de la MISMA
 *   especialidad con la misma lógica FIFO, también hasta 14 días.
 *
 * ANTI-CONDICIÓN DE CARRERA:
 *   Esta función SOLO calcula el slot; NO hace INSERT. La reserva real
 *   ocurre en el API endpoint con lógica de bloqueo optimista.
 * ============================================================
 */

import { addMinutes, addDays, isAfter, isBefore, isEqual, format, parseISO } from 'date-fns'

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type SlotDisponible = {
  date: string        // 'YYYY-MM-DD'
  startTime: string   // 'HH:mm' en hora local Ecuador (UTC-5)
  endTime: string     // 'HH:mm'
  doctorId: string    // puede diferir del solicitado si es doctor alternativo
  esDoctorAlternativo: boolean
  esAlternativa: boolean // true si el slot no está entre los días elegidos por el paciente
}

type Medico = {
  id: string
  dias_laborables: number[] // 0=Dom, 1=Lun, …, 6=Sab
  hora_entrada: string      // 'HH:mm:ss'
  hora_salida: string       // 'HH:mm:ss'
}

type CitaOcupada = {
  fecha_hora: string
  duracion_minutos: number
}

type SupabaseAdminClient = ReturnType<typeof import('@/utils/supabase/admin').createAdminClient>

// ─── Constantes ───────────────────────────────────────────────────────────────

const BLOQUE_MINUTOS = 30        // granularidad de los slots
const DIAS_FALLBACK   = 14       // días a buscar automáticamente si no hay cupo
const TZ_OFFSET_MS    = 5 * 60 * 60 * 1000  // UTC-5 (Ecuador)

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Convierte la hora "actual" a la representación local de Ecuador (UTC-5)
 * para comparar con los slots, que también se construyen en hora local.
 */
function ahoraEcuador(): Date {
  return new Date(Date.now() - TZ_OFFSET_MS)
}

/**
 * Dado un médico y una fecha ISO (YYYY-MM-DD), devuelve el array de slots
 * candidatos en esa fecha. Cada slot es la Date de inicio en UTC para que
 * las comparaciones sean correctas.
 */
function generarSlotsCandidatos(medico: Medico, fechaISO: string, duracionMinutos: number): Date[] {
  const [horaEnt, minEnt] = medico.hora_entrada.split(':').map(Number)
  const [horaSal, minSal] = medico.hora_salida.split(':').map(Number)

  // Construimos el slot inicial en hora local Ecuador, luego lo guardamos como UTC
  // usando el mismo ajuste que hace el frontend: `${fecha}T${hora}:00-05:00`
  const base = parseISO(`${fechaISO}T00:00:00-05:00`) // medianoche Ecuador ese día

  let cursor = new Date(base)
  cursor.setUTCHours(horaEnt + 5, minEnt, 0, 0) // hora_entrada → UTC

  const finJornada = new Date(base)
  finJornada.setUTCHours(horaSal + 5, minSal, 0, 0) // hora_salida → UTC

  const slots: Date[] = []

  while (isBefore(cursor, finJornada) || isEqual(cursor, finJornada)) {
    const slotFin = addMinutes(cursor, duracionMinutos)
    // El slot no puede terminar después del fin de la jornada
    if (isAfter(slotFin, finJornada)) break
    slots.push(new Date(cursor))
    cursor = addMinutes(cursor, BLOQUE_MINUTOS)
  }

  return slots
}

/**
 * Verifica si un slot (inicio, fin) colisiona con alguna de las citas ocupadas.
 * Incluye 30 min de buffer de descanso después de cada cita.
 */
function tieneConflicto(slotInicio: Date, slotFin: Date, citasOcupadas: CitaOcupada[]): boolean {
  return citasOcupadas.some(cita => {
    const citaInicio = new Date(cita.fecha_hora)
    const citaFin = addMinutes(citaInicio, cita.duracion_minutos + 30) // +30 min descanso
    // Conflicto si los intervalos se superponen
    return isBefore(slotInicio, citaFin) && isAfter(slotFin, citaInicio)
  })
}

// ─── Función de búsqueda central ─────────────────────────────────────────────

/**
 * Busca el primer slot libre FIFO para un médico en un conjunto de fechas.
 * Retorna el slot y si es alternativa (no estaba entre los días solicitados originalmente).
 */
async function buscarSlotParaMedico(
  supabase: SupabaseAdminClient,
  medico: Medico,
  fechasISO: string[],   // YYYY-MM-DD, ya ordenadas cronológicamente
  duracionMinutos: number,
  esAlternativa: boolean,
): Promise<Omit<SlotDisponible, 'esDoctorAlternativo'> | null> {
  const ahora = ahoraEcuador()

  for (const fechaISO of fechasISO) {
    // getDay() sobre T12:00:00 local es seguro en cualquier timezone del servidor
    const dayOfWeek = parseISO(`${fechaISO}T12:00:00`).getDay()

    // El médico no trabaja este día de la semana → FIFO: pasar al siguiente
    if (!medico.dias_laborables.includes(dayOfWeek)) continue

    // Rango del día en Ecuador (UTC-5): 00:00 → 23:59 hora local
    // Usamos offset explícito -05:00 para que el servidor en UTC lo maneje bien
    const inicioDia = `${fechaISO}T00:00:00-05:00`
    const finDia    = `${fechaISO}T23:59:59-05:00`

    const { data: citas, error: citasErr } = await supabase
      .from('citas')
      .select('fecha_hora, duracion_minutos')
      .eq('id_medico', medico.id)
      // Sintaxis PostgREST correcta para NOT IN: llaves {val1,val2}
      .not('estado', 'in', '(cancelada,pendiente_pago)')
      .gte('fecha_hora', inicioDia)
      .lte('fecha_hora', finDia)

    if (citasErr) {
      console.error(`[FIFO] Error consultando citas del médico ${medico.id} en ${fechaISO}:`, citasErr.message)
    }

    const citasOcupadas: CitaOcupada[] = citas ?? []

    // Generar candidatos FIFO en orden cronológico ascendente
    const candidatos = generarSlotsCandidatos(medico, fechaISO, duracionMinutos)

    for (const slotInicio of candidatos) {
      const slotFin = addMinutes(slotInicio, duracionMinutos)

      // No permitir slots en el pasado (incluyendo ahora)
      if (!isAfter(slotInicio, ahora)) continue

      // Verificar colisión — FIFO: primer slot libre encontrado = ganador
      if (!tieneConflicto(slotInicio, slotFin, citasOcupadas)) {
        return {
          date: fechaISO,
          startTime: format(slotInicio, 'HH:mm'),
          endTime:   format(slotFin,   'HH:mm'),
          doctorId:  medico.id,
          esAlternativa,
        }
      }
    }
  }

  return null
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * getAvailableSlot — Función principal del módulo FIFO.
 *
 * @param doctorId       ID del médico solicitado
 * @param selectedDays   Días en que el paciente puede asistir (YYYY-MM-DD)
 * @param duracionMinutos Duración de la cita (default 30 min)
 * @param idEspecialidad  Especialidad para la búsqueda de doctor alternativo
 *
 * @returns SlotDisponible con el primer hueco libre, o null si no hay ninguno.
 *
 * Orden de búsqueda:
 *   1. Días seleccionados → médico original (FIFO estricto)
 *   2. Próximos 14 días   → médico original (fallback automático)
 *   3. Próximos 14 días   → otros médicos de la misma especialidad (fallback de doctor)
 */
export async function getAvailableSlot(
  doctorId: string,
  selectedDays: string[],
  duracionMinutos: number = 30,
  idEspecialidad?: string,
): Promise<SlotDisponible | null> {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = createAdminClient()

  // ── Obtener datos del médico solicitado ───────────────────────────────────
  const { data: medico, error: medicoErr } = await supabase
    .from('medicos')
    .select('id, dias_laborables, hora_entrada, hora_salida')
    .eq('id', doctorId)
    .single()

  if (medicoErr || !medico) {
    console.error('[FIFO] Médico no encontrado:', doctorId)
    return null
  }

  // FIFO garantía: ordenar los días seleccionados cronológicamente
  const diasOrdenados = [...selectedDays].sort()

  console.log(`[FIFO] Buscando slot para médico ${doctorId}, días: ${diasOrdenados.join(', ')}`)

  // ── Fase 1: días seleccionados por el paciente ────────────────────────────
  const slotFase1 = await buscarSlotParaMedico(supabase, medico, diasOrdenados, duracionMinutos, false)
  if (slotFase1) {
    console.log(`[FIFO] ✅ Slot encontrado (Fase 1 — días solicitados): ${slotFase1.date} ${slotFase1.startTime}`)
    return { ...slotFase1, esDoctorAlternativo: false }
  }

  // ── Fase 2: fallback 14 días desde el último día seleccionado ────────────
  const ultimoDia = diasOrdenados[diasOrdenados.length - 1]
  const diasFallback: string[] = []
  let cursor = addDays(parseISO(`${ultimoDia}T12:00:00`), 1)

  for (let i = 0; i < DIAS_FALLBACK; i++) {
    diasFallback.push(format(cursor, 'yyyy-MM-dd'))
    cursor = addDays(cursor, 1)
  }

  console.log(`[FIFO] Fase 1 sin resultado. Buscando en fallback de ${DIAS_FALLBACK} días (Fase 2)`)
  const slotFase2 = await buscarSlotParaMedico(supabase, medico, diasFallback, duracionMinutos, true)
  if (slotFase2) {
    console.log(`[FIFO] ✅ Slot encontrado (Fase 2 — fallback médico original): ${slotFase2.date} ${slotFase2.startTime}`)
    return { ...slotFase2, esDoctorAlternativo: false }
  }

  // ── Fase 3: otros médicos de la misma especialidad ────────────────────────
  if (!idEspecialidad) {
    console.log('[FIFO] Sin especialidad para búsqueda alternativa. Devolviendo null.')
    return null
  }

  const { data: otrosMedicos } = await supabase
    .from('medicos')
    .select('id, dias_laborables, hora_entrada, hora_salida')
    .eq('id_especialidad', idEspecialidad)
    .neq('id', doctorId)
    .not('id_auth_user', 'is', null) // solo médicos con cuenta activa

  if (!otrosMedicos?.length) {
    console.log('[FIFO] No hay otros médicos en la especialidad. Devolviendo null.')
    return null
  }

  // Buscar en los 14 días desde HOY para los médicos alternativos
  const diasDesdeHoy: string[] = []
  let cursorHoy = addDays(new Date(), 0)
  for (let i = 0; i < DIAS_FALLBACK; i++) {
    diasDesdeHoy.push(format(cursorHoy, 'yyyy-MM-dd'))
    cursorHoy = addDays(cursorHoy, 1)
  }

  console.log(`[FIFO] Fase 2 sin resultado. Buscando en ${otrosMedicos.length} médico(s) alternativos (Fase 3)`)

  for (const otroMedico of otrosMedicos) {
    const slotFase3 = await buscarSlotParaMedico(
      supabase,
      otroMedico as Medico,
      diasDesdeHoy,
      duracionMinutos,
      true,
    )
    if (slotFase3) {
      console.log(`[FIFO] ✅ Slot encontrado (Fase 3 — doctor alternativo ${otroMedico.id}): ${slotFase3.date} ${slotFase3.startTime}`)
      return { ...slotFase3, esDoctorAlternativo: true }
    }
  }

  console.log('[FIFO] ❌ Sin disponibilidad en ninguna fase. Devolviendo null.')
  return null
}
