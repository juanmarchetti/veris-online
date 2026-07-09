import BrandLogo from './BrandLogo'

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant bg-surface-container-highest">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <BrandLogo href="/" />
          <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">
            Plataforma web de videoconsulta médica, agenda online e historial clínico digital.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-on-surface-variant md:items-end">
          <span className="font-semibold">Soporte: 6009600</span>
          <span>© 2026 Veris Online. Todos los derechos reservados.</span>
          <div className="flex flex-wrap gap-3">
            <a href="#" className="font-semibold text-on-surface-variant underline underline-offset-4 hover:text-primary">
              Términos
            </a>
            <a href="#" className="font-semibold text-on-surface-variant underline underline-offset-4 hover:text-primary">
              Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
