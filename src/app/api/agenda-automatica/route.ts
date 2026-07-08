/**
 * API Route: POST /api/agenda-automatica
 * ============================================================
 * Recibe la solicitud del paciente con días preferidos y asigna
 * automáticamente el primer slot libre (FIFO).
 *
 * ANTI-RACE CONDITION (bloqueo optimista):
 *   El INSERT a `citas` usa la constraint UNIQUE (id_medico, fecha_hora)
 *   que ya existe en la BD (migración 0004). Si dos pacientes intentan
 *   reservar el mismo slot al mismo tiempo, uno recibirá error 23505
 *   y el sistema reintentará automáticamente con el siguiente slot FIFO.
 *
 * Retorna JSON: { citaId, fecha, hora, esMismoDia, esAlternativa, esDoctorAlternativo, doctorNombre }
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAvailableSlot } from '@/utils/agendamiento-automatico'
import { addMinutes, format } from 'date-fns'

const MAX_REINTENTOS = 3  // máximos reintentos si hay condición de carrera

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // ── 1. Autenticar usuario ─────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Inicia sesión nuevamente.' }, { status: 401 })
    }

    // ── 2. Obtener perfil del paciente ────────────────────────────────────
    const { data: paciente, error: pacError } = await supabase
      .from('pacientes')
      .select('id, nombre_completo')
      .eq('id_auth_user', user.id)
      .single()

    if (pacError || !paciente) {
      return NextResponse.json({ error: 'No se encontró tu perfil de paciente.' }, { status: 404 })
    }

    // ── 3. Parsear y validar el body ──────────────────────────────────────
    const body = await req.json() as {
      doctorId: string
      selectedDays: string[]    // ['YYYY-MM-DD', ...]
      duracionMinutos: number
      motivoConsulta: string
      idEspecialidad: string
      idConvenio?: string
    }

    const { doctorId, selectedDays, duracionMinutos, motivoConsulta, idEspecialidad, idConvenio } = body

    if (!doctorId || !selectedDays?.length || !duracionMinutos || !motivoConsulta || !idEspecialidad) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    if (selectedDays.length > 7) {
      return NextResponse.json({ error: 'Puedes seleccionar máximo 7 días.' }, { status: 400 })
    }

    // ── 4. Obtener precio base de la especialidad ─────────────────────────
    const { createAdminClient } = await import('@/utils/supabase/admin')
    const adminClient = createAdminClient()

    const { data: especialidad } = await adminClient
      .from('especialidades')
      .select('precio_base, nombre')
      .eq('id', idEspecialidad)
      .single()

    const precioBaseHora = (especialidad as { precio_base?: number } | null)?.precio_base ?? 25.00
    const montoConsulta  = (precioBaseHora / 60) * duracionMinutos

    // ── 5. Bucle FIFO con reintentos anti-race ────────────────────────────
    let slotFinal = null
    const diasExcluidos: string[] = []
    let intento = 0

    while (!slotFinal && intento < MAX_REINTENTOS) {
      intento++

      // Calcular slot usando la lógica FIFO pura
      const diasParaBuscar = selectedDays.filter(d => !diasExcluidos.includes(d))
      const slot = await getAvailableSlot(doctorId, diasParaBuscar, duracionMinutos, idEspecialidad)

      if (!slot) {
        return NextResponse.json({
          error: 'No hay disponibilidad en los próximos días para ningún médico de esta especialidad.'
        }, { status: 409 })
      }

      // Construir fecha_hora en UTC (la función devuelve hora en UTC-5)
      const fechaHoraISO = `${slot.date}T${slot.startTime}:00-05:00`

      // Usar el doctorId del slot (puede ser el original o alternativo)
      const doctorIdFinal = slot.doctorId

      // ── 6. INSERT cita con bloqueo optimista ──────────────────────────
      const { data: cita, error: citaError } = await adminClient
        .from('citas')
        .insert({
          id_paciente:      paciente.id,
          id_medico:        doctorIdFinal,
          id_especialidad:  idEspecialidad,
          id_convenio:      idConvenio ?? null,
          fecha_hora:       fechaHoraISO,
          motivo_consulta:  motivoConsulta,
          duracion_minutos: duracionMinutos,
          estado:           'pendiente_pago',
          canal_origen:     'Web',
        })
        .select('id')
        .single()

      if (citaError) {
        if (citaError.code === '23505') {
          // Condición de carrera: otro paciente tomó este slot justo antes
          // → excluir este día y reintentar con el siguiente slot FIFO
          console.warn(`[FIFO] Race condition detectada en ${slot.date} ${slot.startTime}. Reintentando... (intento ${intento})`)
          diasExcluidos.push(slot.date)
          continue
        }
        return NextResponse.json({ error: 'Error al crear la cita: ' + citaError.message }, { status: 500 })
      }

      slotFinal = { cita, slot }
    }

    if (!slotFinal) {
      return NextResponse.json({
        error: 'No se pudo reservar el slot por alta demanda. Intenta nuevamente en unos segundos.'
      }, { status: 409 })
    }

    const { cita, slot } = slotFinal

    // ── 7. INSERT pago vinculado ──────────────────────────────────────────
    const fechaLimite = new Date(Date.now() + 30 * 60 * 1000) // +30 min
    const { error: pagoError } = await adminClient
      .from('pagos')
      .insert({
        id_cita:          cita!.id,
        monto:            montoConsulta,
        fecha_limite_pago: fechaLimite.toISOString(),
        estado_pago:      'pendiente',
      })

    if (pagoError) {
      // Rollback manual: eliminar la cita huérfana
      await adminClient.from('citas').delete().eq('id', cita!.id)
      return NextResponse.json({ error: 'Error al crear el registro de pago.' }, { status: 500 })
    }

    // ── 8. Log de trazabilidad ────────────────────────────────────────────
    const razon = slot.esDoctorAlternativo
      ? `Médico original sin disponibilidad. Se asignó doctor alternativo (${slot.doctorId}).`
      : slot.esAlternativa
        ? `Días seleccionados sin cupo. Se asignó el primer slot disponible en los 14 días siguientes.`
        : `Slot FIFO directo en días seleccionados por el paciente.`

    await adminClient
      .from('slot_asignacion_log')
      .insert({
        id_cita:            cita!.id,
        id_medico:          slot.doctorId,
        id_paciente:        paciente.id,
        dias_solicitados:   selectedDays,
        slot_asignado:      `${slot.date}T${slot.startTime}:00-05:00`,
        es_alternativa:     slot.esAlternativa,
        medico_alternativo: slot.esDoctorAlternativo,
        razon,
      })

    console.log(`[FIFO] ✅ Cita creada ${cita!.id} → ${slot.date} ${slot.startTime} (médico ${slot.doctorId}). Razón: ${razon}`)

    // ── 9. Obtener nombre del médico asignado para mostrar al paciente ─────
    const { data: medicoAsignado } = await adminClient
      .from('medicos')
      .select('nombre_completo')
      .eq('id', slot.doctorId)
      .single()

    // ── 10. Retornar resultado al cliente ─────────────────────────────────
    return NextResponse.json({
      citaId:              cita!.id,
      fecha:               slot.date,
      horaInicio:          slot.startTime,
      horaFin:             slot.endTime,
      esAlternativa:       slot.esAlternativa,
      esDoctorAlternativo: slot.esDoctorAlternativo,
      doctorNombre:        (medicoAsignado as { nombre_completo?: string } | null)?.nombre_completo ?? 'Médico asignado',
      razon,
    })

  } catch (err) {
    console.error('[FIFO] Error inesperado en agenda-automatica:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
