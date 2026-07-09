import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AlertTriangle, CalendarCheck, ClipboardList, CreditCard, Headphones, LogIn, UserPlus, Video } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil) {
      if (perfil.rol === 'admin') redirect('/admin')
      if (perfil.rol === 'agente_cc') redirect('/panel-cc')
      if (perfil.rol === 'medico') redirect('/panel-medico')
      if (perfil.rol === 'paciente') redirect('/mis-citas')
    }
  }

  const pasos = [
    {
      icon: ClipboardList,
      title: 'Identificate',
      text: 'Ingresa con tu cuenta o crea una nueva si aun no usas Veris Online.',
    },
    {
      icon: CalendarCheck,
      title: 'Agenda',
      text: 'Selecciona especialidad, medico y dias disponibles para recibir un horario asignado.',
    },
    {
      icon: CreditCard,
      title: 'Confirma el pago',
      text: 'Completa el pago dentro de la ventana de 30 minutos para confirmar la cita.',
    },
    {
      icon: Video,
      title: 'Conectate',
      text: 'El acceso a Zoom se habilita 3 minutos antes de la hora programada.',
    },
  ]

  return (
    <main className="bg-background text-foreground">
      <section className="mx-auto grid min-h-[calc(100vh-170px)] w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-sm font-semibold text-secondary">
              <Video className="h-4 w-4" />
              Videoconsulta web Veris
            </span>

            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
                Agenda, paga y accede a tu atencion medica online
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">
                Portal web para gestionar videoconsultas de forma guiada: registro, validacion, pago,
                conexion por Zoom e historial clinico digital.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/login" className="btn-primary py-3 text-base">
              <LogIn className="h-5 w-5" />
              Ingresar al portal
            </Link>
            <Link href="/registro" className="btn-outline w-full py-3 text-base">
              <UserPlus className="h-5 w-5" />
              Crear cuenta
            </Link>
          </div>

          <div className="grid gap-3 rounded-lg border border-error/30 bg-error-container/60 p-4 text-on-error-container">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide">No usar en emergencias</h2>
                <p className="mt-1 text-sm leading-relaxed">
                  Si presentas dolor de pecho, dificultad para respirar, perdida de conocimiento u otros sintomas graves,
                  acude de inmediato a un centro de salud o llama a emergencias.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest">
          <div className="border-b border-outline-variant p-5">
            <h2 className="text-xl font-bold text-primary">Flujo de atencion</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Pasos esperados para completar una videoconsulta.</p>
          </div>

          <div className="divide-y divide-outline-variant">
            {pasos.map((paso, index) => {
              const Icon = paso.icon
              return (
                <div key={paso.title} className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                      Paso {index + 1}
                    </p>
                    <h3 className="mt-1 font-bold text-on-surface">{paso.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{paso.text}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-outline-variant bg-surface-container-low p-5">
            <div className="flex items-start gap-3 text-sm text-on-surface-variant">
              <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <p>
                Soporte Contact Center: <strong className="text-on-surface">6009600</strong>. Si tu historial Veris
                aun no esta validado, el equipo de soporte debe habilitarlo antes de agendar.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
