import Link from 'next/link'
import { Calendar, CreditCard, Mail, MonitorPlay, Phone } from 'lucide-react'

const temas = [
  {
    icon: Calendar,
    title: '¿Cómo agendar una cita?',
    text: 'Ingresa al portal, abre Agendar cita, selecciona especialidad, médico y tus días disponibles. El sistema asignará automáticamente el mejor horario libre.',
  },
  {
    icon: MonitorPlay,
    title: '¿Cómo me conecto a la videoconsulta?',
    text: 'Ve a Mis citas. Si la cita está confirmada y el acceso ya fue habilitado, aparecerá el botón para conectarte a Zoom.',
  },
  {
    icon: CreditCard,
    title: 'Pago de prueba',
    text: 'El proyecto usa una pasarela sandbox. Sirve para confirmar el flujo académico sin cobrar dinero real.',
  },
]

export default function AyudaPage() {
  return (
    <main className="page-shell grid gap-6">
      <div className="mx-auto grid max-w-3xl gap-2 text-center">
        <span className="section-kicker mx-auto">Soporte</span>
        <h1 className="text-3xl font-extrabold text-primary sm:text-4xl">Centro de ayuda</h1>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          Resuelve las dudas principales sobre agenda, videoconsulta y confirmación de pago.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {temas.map((tema) => {
          const Icon = tema.icon
          return (
            <section key={tema.title} className="card p-5">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-secondary/10 text-secondary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-extrabold text-on-surface">{tema.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{tema.text}</p>
            </section>
          )
        })}
      </div>

      <section className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-center">
        <h2 className="text-lg font-extrabold text-primary">¿Necesitas soporte técnico?</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Si tienes problemas para ingresar, agendar o conectarte, usa estos canales de soporte.
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 text-sm font-semibold sm:flex-row">
          <a href="mailto:soporte@veris.med.ec" className="inline-flex items-center gap-2 text-primary hover:underline">
            <Mail className="h-4 w-4" /> soporte@veris.med.ec
          </a>
          <span className="hidden text-outline sm:block">|</span>
          <span className="inline-flex items-center gap-2 text-on-surface">
            <Phone className="h-4 w-4" /> 6009600
          </span>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-sm">
        <Link href="/mis-citas" className="btn-primary">
          Volver a mis citas
        </Link>
      </div>
    </main>
  )
}
