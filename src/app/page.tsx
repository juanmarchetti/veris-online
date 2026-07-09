import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  LogIn,
  ShieldCheck,
  UserPlus,
  Video,
} from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

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
      if (perfil.rol === 'paciente') redirect('/inicio')
    }
  }

  const pasos = [
    {
      icon: ClipboardList,
      title: 'Registro seguro',
      text: 'Crea tu cuenta o ingresa con tus credenciales para acceder al portal.',
    },
    {
      icon: CalendarCheck,
      title: 'Agenda automática',
      text: 'Selecciona especialidad, médico y días disponibles; el sistema asigna el mejor horario libre.',
    },
    {
      icon: CreditCard,
      title: 'Confirmación',
      text: 'Completa el flujo de pago de prueba para confirmar la cita en la base de datos.',
    },
    {
      icon: Video,
      title: 'Videoconsulta',
      text: 'Accede a Zoom desde tus citas cuando la consulta esté habilitada.',
    },
  ]

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="page-shell grid min-h-[calc(100vh-190px)] content-center gap-8 py-10 sm:py-14">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <BrandLogo href="/" />
            <span className="section-kicker">
              <ShieldCheck className="h-4 w-4" />
              Portal médico conectado a Supabase
            </span>
            <div className="grid gap-4">
              <h1 className="text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
                Veris Online
              </h1>
              <p className="text-lg leading-relaxed text-on-surface-variant sm:text-xl">
                Plataforma web para agendar videoconsultas, confirmar atención online y consultar historial clínico digital.
              </p>
            </div>
            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
              <Link href="/login" className="btn-primary py-3 text-base">
                <LogIn className="h-5 w-5" />
                Ingresar al portal
              </Link>
              <Link href="/registro" className="btn-outline w-full py-3 text-base">
                <UserPlus className="h-5 w-5" />
                Crear cuenta
              </Link>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-error/30 bg-error-container/60 p-4 text-on-error-container">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="text-sm font-bold uppercase">No usar en emergencias</h2>
                <p className="mt-1 text-sm leading-relaxed">
                  Si presentas dolor de pecho, dificultad para respirar, pérdida de conocimiento u otros síntomas graves,
                  acude de inmediato a un centro de salud o llama a emergencias.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-8">
        <div className="mb-5 flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-primary">Flujo de atención</h2>
          <p className="text-sm text-on-surface-variant">Cada paso queda conectado al sistema y a la base de datos.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map((paso, index) => {
            const Icon = paso.icon
            return (
              <article key={paso.title} className="card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-extrabold uppercase text-on-surface-variant">Paso {index + 1}</span>
                </div>
                <h3 className="font-bold text-on-surface">{paso.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{paso.text}</p>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
