'use client'

/**
 * FormAgendaAutomatica.tsx
 * ============================================================
 * Flujo de agendamiento automático FIFO en 3 pasos.
 * El paciente NO elige la hora — el sistema la asigna automáticamente.
 *
 * Paso 1 → Seleccionar especialidad, médico y duración
 * Paso 2 → Elegir días disponibles + motivo de consulta
 * Paso 3 → Mostrar la hora asignada automáticamente + confirmar o rechazar
 * ============================================================
 */

import { useState, useMemo, useTransition } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Info,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Especialidad = { id: string; nombre: string }
type Medico       = { id: string; nombre_completo: string; id_especialidad: string }
type Convenio     = { id: string; nombre_aseguradora: string }

type Props = {
  especialidades: Especialidad[]
  medicos:        Medico[]
  convenios:      Convenio[]
}

type SlotAsignado = {
  citaId:              string
  fecha:               string
  horaInicio:          string
  horaFin:             string
  esAlternativa:       boolean
  esDoctorAlternativo: boolean
  doctorNombre:        string
  razon:               string
}

const DURACIONES = [
  { valor: 30,  etiqueta: '30 minutos' },
  { valor: 60,  etiqueta: '1 hora'     },
  { valor: 90,  etiqueta: '1 h 30 min' },
  { valor: 120, etiqueta: '2 horas'    },
]

const MAX_DIAS = 7

// ─── Helper de formato de fecha ───────────────────────────────────────────────

function formatearFechaAmigable(fechaISO: string): string {
  try {
    const d = parseISO(`${fechaISO}T12:00:00`)
    return format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return fechaISO
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function FormAgendaAutomatica({ especialidades, medicos, convenios }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── Estado del wizard ─────────────────────────────────────────────────────
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [error, setError] = useState('')

  // Paso 1
  const [especialidadId, setEspecialidadId] = useState('')
  const [medicoId, setMedicoId]             = useState('')
  const [convenioId, setConvenioId]         = useState('')
  const [duracion, setDuracion]             = useState(30)

  // Paso 2
  const [diasSeleccionados, setDiasSeleccionados] = useState<Date[]>([])
  const [motivo, setMotivo]                       = useState('')

  // Paso 3
  const [slotAsignado, setSlotAsignado] = useState<SlotAsignado | null>(null)
  const [buscando, setBuscando]         = useState(false)

  // ── Filtros ───────────────────────────────────────────────────────────────
  const medicosFiltrados = useMemo(() => {
    if (!especialidadId) return medicos
    return medicos.filter(m => m.id_especialidad === especialidadId)
  }, [especialidadId, medicos])

  // ── Paso 1 → 2 ───────────────────────────────────────────────────────────
  const irPaso2 = () => {
    if (!especialidadId) { setError('Selecciona una especialidad.'); return }
    if (!medicoId)       { setError('Selecciona un médico.'); return }
    setError('')
    setPaso(2)
  }

  // ── Paso 2 → 3: buscar slot ───────────────────────────────────────────────
  const buscarSlot = async () => {
    if (diasSeleccionados.length === 0) {
      setError('Selecciona al menos un día en que puedas asistir.')
      return
    }
    if (!motivo.trim()) {
      setError('Describe el motivo de tu consulta.')
      return
    }
    setError('')
    setBuscando(true)

    try {
      const diasISO = diasSeleccionados
        .map(d => format(d, 'yyyy-MM-dd'))
        .sort() // garantizar orden cronológico

      const res = await fetch('/api/agenda-automatica', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId:       medicoId,
          selectedDays:   diasISO,
          duracionMinutos: duracion,
          motivoConsulta:  motivo.trim(),
          idEspecialidad:  especialidadId,
          idConvenio:      convenioId || undefined,
        }),
      })

      const data = await res.json() as SlotAsignado & { error?: string }

      if (!res.ok || data.error) {
        setError(data.error ?? 'Error inesperado. Intenta de nuevo.')
        setBuscando(false)
        return
      }

      setSlotAsignado(data)
      setPaso(3)
    } catch {
      setError('Error de red. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setBuscando(false)
    }
  }

  // ── Confirmar cita y redirigir a pago ─────────────────────────────────────
  const confirmarYPagar = () => {
    if (!slotAsignado) return
    startTransition(() => {
      router.push(`/pago?cita=${slotAsignado.citaId}`)
    })
  }

  // ── Volver a elegir días ───────────────────────────────────────────────────
  const volverAElegirDias = () => {
    setSlotAsignado(null)
    setDiasSeleccionados([])
    setError('')
    setPaso(2)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-3xl mx-auto">

      {/* ── Indicador de pasos ─────────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-center overflow-hidden">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                paso === n
                  ? 'bg-[#0c54a0] text-white shadow-md'
                  : paso > n
                    ? 'bg-[#006a63] text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {paso > n ? <CheckCircle size={16} /> : n}
            </div>
            {n < 3 && (
              <div className={`h-0.5 w-10 transition-all sm:w-16 ${paso > n ? 'bg-[#006a63]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Error global ───────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PASO 1: Seleccionar especialidad y médico
      ═══════════════════════════════════════════════════════════════════ */}
      {paso === 1 && (
        <div className="card flex flex-col gap-6 p-5 sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-[#003d79] flex items-center gap-2 mb-1">
              <Stethoscope size={22} />
              ¿Con qué médico deseas consultar?
            </h2>
            <p className="text-sm text-gray-500">
              Elige especialidad y doctor. El sistema encontrará la hora disponible más próxima para ti.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Especialidad */}
            <div>
              <label className="input-label">Especialidad *</label>
              <select
                className="input-field"
                value={especialidadId}
                onChange={(e) => {
                  setEspecialidadId(e.target.value)
                  setMedicoId('')
                }}
              >
                <option value="">Selecciona una especialidad</option>
                {especialidades.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            {/* Médico */}
            <div>
              <label className="input-label">Médico *</label>
              <select
                className="input-field"
                value={medicoId}
                onChange={(e) => setMedicoId(e.target.value)}
                disabled={!especialidadId}
              >
                <option value="">
                  {especialidadId ? 'Selecciona un médico' : 'Primero elige una especialidad'}
                </option>
                {medicosFiltrados.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre_completo}</option>
                ))}
              </select>
            </div>

            {/* Duración */}
            <div>
              <label className="input-label">Duración de la consulta *</label>
              <select
                className="input-field"
                value={duracion}
                onChange={(e) => setDuracion(Number(e.target.value))}
              >
                {DURACIONES.map(d => (
                  <option key={d.valor} value={d.valor}>{d.etiqueta}</option>
                ))}
              </select>
            </div>

            {/* Convenio */}
            <div>
              <label className="input-label">Seguro / Convenio</label>
              <select
                className="input-field"
                value={convenioId}
                onChange={(e) => setConvenioId(e.target.value)}
              >
                <option value="">Ninguno / Particular</option>
                {convenios.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre_aseguradora}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn-primary" onClick={irPaso2}>
            Continuar
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PASO 2: Seleccionar días disponibles
      ═══════════════════════════════════════════════════════════════════ */}
      {paso === 2 && (
        <div className="card flex flex-col gap-6 p-5 sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-[#003d79] flex items-center gap-2 mb-1">
              <Calendar size={22} />
              ¿En qué días puedes asistir?
            </h2>
            <p className="text-sm text-gray-500">
              Marca todos los días en que estarías disponible (máx. {MAX_DIAS}).
              El sistema elegirá automáticamente el horario más cercano disponible.
            </p>
          </div>

          {/* Calendario multi-selección */}
          <div className="overflow-x-auto rounded-lg border bg-white p-3 sm:p-4">
            <DayPicker
              mode="multiple"
              selected={diasSeleccionados}
              onSelect={(days) => setDiasSeleccionados(days ?? [])}
              disabled={[
                { before: startOfDay(new Date()) }, // permite seleccionar desde hoy
                { dayOfWeek: [0] },                  // sin domingos
                (date: Date) => (diasSeleccionados.length >= MAX_DIAS && !diasSeleccionados.some(d => d.toDateString() === date.toDateString()))
              ]}
              locale={es}
              className="w-full"
            />
          </div>

          {/* Días seleccionados */}
          {diasSeleccionados.length > 0 && (
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs font-semibold text-[#003d79] mb-2 uppercase tracking-wide">
                Días seleccionados ({diasSeleccionados.length}/{MAX_DIAS})
              </p>
              <div className="flex flex-wrap gap-2">
                {[...diasSeleccionados].sort((a, b) => a.getTime() - b.getTime()).map(d => (
                  <span
                    key={d.toISOString()}
                  className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs text-blue-800"
                  >
                    {format(d, "EEE d 'de' MMM", { locale: es })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="input-label">Motivo de consulta *</label>
            <textarea
              rows={3}
              className="input-field"
              placeholder="Describe tus síntomas: cuándo empezaron, frecuencia, intensidad..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          {/* Info FIFO */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              El sistema asignará automáticamente el <strong>primer horario libre disponible</strong> entre los días
              que seleccionaste. Si ninguno tiene cupo, buscará en los próximos 14 días o con otro médico disponible.
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="btn-outline w-full sm:flex-1"
              onClick={() => { setError(''); setPaso(1) }}
            >
              <ArrowLeft size={16} />
              Volver
            </button>
            <button
              className="btn-primary w-full sm:flex-[2]"
              onClick={buscarSlot}
              disabled={buscando}
              style={{ flex: 2 }}
            >
              {buscando ? (
                <><Loader2 size={16} className="animate-spin" /> Buscando disponibilidad...</>
              ) : (
                <><Clock size={16} /> Asignarme el mejor horario</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PASO 3: Slot asignado automáticamente
      ═══════════════════════════════════════════════════════════════════ */}
      {paso === 3 && slotAsignado && (
        <div className="card flex flex-col gap-6 p-5 sm:p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#003d79] mb-1">
              ¡Horario encontrado!
            </h2>
            <p className="text-sm text-gray-500">
              El sistema asignó automáticamente el primer horario disponible.
            </p>
          </div>

          {/* Tarjeta del slot asignado */}
          <div className="flex flex-col gap-4 rounded-lg bg-primary p-5 text-white sm:p-6">
            {/* Doctor alternativo */}
            {slotAsignado.esDoctorAlternativo && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-400/20 px-4 py-2 text-sm">
                <AlertTriangle size={14} />
                <span>El médico solicitado no tenía disponibilidad. Se te asignó otro doctor de la misma especialidad.</span>
              </div>
            )}
            {/* Slot alternativo (14 días) */}
            {slotAsignado.esAlternativa && !slotAsignado.esDoctorAlternativo && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-300/30 bg-blue-400/20 px-4 py-2 text-sm">
                <Info size={14} />
                <span>Los días seleccionados no tenían disponibilidad. Se buscó automáticamente el próximo hueco.</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <User size={20} className="opacity-70 shrink-0" />
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Médico asignado</p>
                <p className="font-semibold">{slotAsignado.doctorNombre}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={20} className="opacity-70 shrink-0" />
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Fecha</p>
                <p className="font-semibold capitalize">{formatearFechaAmigable(slotAsignado.fecha)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock size={20} className="opacity-70 shrink-0" />
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Hora</p>
                <p className="font-semibold text-2xl">{slotAsignado.horaInicio} — {slotAsignado.horaFin}</p>
              </div>
            </div>
          </div>

          {/* Advertencia: no es modificable */}
          <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              El horario fue asignado por el sistema y <strong>no puede modificarse manualmente</strong>.
              Si no te conviene, puedes elegir otros días.
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {/* Confirmar */}
            <button
              className="btn-primary"
              onClick={confirmarYPagar}
              disabled={isPending}
              style={{ padding: '1rem', fontSize: '1.05rem' }}
            >
              {isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Redirigiendo al pago...</>
              ) : (
                <>Confirmar y proceder al pago <ArrowRight size={16} /></>
              )}
            </button>

            {/* Rechazar */}
            <button
              className="btn-outline w-full"
              onClick={volverAElegirDias}
            >
              <RefreshCw size={15} />
              Elegir otros días
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
