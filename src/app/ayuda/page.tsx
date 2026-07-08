import Link from 'next/link'

export default function AyudaPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
      <div className="bg-white dark:bg-black/20 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-foreground/5 w-full">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">Centro de Ayuda</h1>
        
        <div className="space-y-6">
          <section className="bg-surface p-6 rounded-xl border border-foreground/10">
            <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
              <span>📅</span> ¿Cómo agendar una cita?
            </h2>
            <p className="text-foreground/80 leading-relaxed text-sm">
              Para agendar una cita, dirígete a la pestaña de <strong>Inicio</strong>, selecciona tu motivo de consulta, la especialidad y el médico de tu preferencia. 
              Luego elige la fecha y hora disponible. Finalmente, serás redirigido a la pasarela de pago para confirmar tu turno.
            </p>
          </section>

          <section className="bg-surface p-6 rounded-xl border border-foreground/10">
            <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
              <span>💻</span> ¿Cómo me conecto a la videoconsulta?
            </h2>
            <p className="text-foreground/80 leading-relaxed text-sm">
              Ve a la sección <strong>Mis citas</strong>. Si tu cita está confirmada y faltan menos de 3 minutos para la hora agendada, 
              aparecerá el botón <em>"Conectarse a Zoom"</em>. Al hacer clic, se abrirá la sala de espera virtual.
            </p>
          </section>

          <section className="bg-surface p-6 rounded-xl border border-foreground/10">
            <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
              <span>💳</span> Problemas con el pago
            </h2>
            <p className="text-foreground/80 leading-relaxed text-sm">
              Si tu pago fue rechazado, puedes volver a intentarlo desde <strong>Mis citas</strong> siempre y cuando no hayan pasado 30 minutos desde 
              que agendaste el turno. Si el tiempo expira, la cita se cancelará automáticamente y deberás agendar una nueva.
            </p>
          </section>
        </div>

        <div className="mt-10 text-center bg-primary/5 p-6 rounded-xl border border-primary/20">
          <h3 className="font-bold text-lg mb-2">¿Necesitas soporte técnico?</h3>
          <p className="text-foreground/70 text-sm mb-4">
            Si estás experimentando problemas técnicos urgentes, contáctanos:
          </p>
          <div className="flex justify-center gap-4 text-sm font-medium">
            <a href="mailto:soporte@veris.med.ec" className="text-primary hover:underline flex items-center gap-1">
              ✉️ soporte@veris.med.ec
            </a>
            <span className="text-foreground/30">|</span>
            <span className="text-foreground flex items-center gap-1">
              📞 1800-VERIS-ONLINE
            </span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/mis-citas" className="btn-primary inline-block px-8 py-3 rounded-xl font-bold">
            Volver a Mis Citas
          </Link>
        </div>
      </div>
    </main>
  )
}
