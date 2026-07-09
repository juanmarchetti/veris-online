'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ClipboardList,
  HelpCircle,
  History,
  Home,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react'
import BrandLogo from './BrandLogo'
import LogoutButton from './LogoutButton'
import type { Role } from '@/utils/auth'

type NavbarClientProps = {
  rol: Role | null
  userEmail: string | null
  avatarUrl: string | null
}

type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

function navItemsForRole(rol: Role | null): NavItem[] {
  if (rol === 'paciente') {
    return [
      { href: '/inicio', label: 'Inicio', icon: Home },
      { href: '/agendar-cita', label: 'Agendar cita', icon: CalendarDays },
      { href: '/mis-citas', label: 'Mis citas', icon: ClipboardList },
      { href: '/mis-citas/historial', label: 'Historial', icon: History },
      { href: '/ayuda', label: 'Ayuda', icon: HelpCircle },
    ]
  }

  if (rol === 'medico') {
    return [{ href: '/panel-medico', label: 'Panel médico', icon: Stethoscope }]
  }

  if (rol === 'agente_cc') {
    return [{ href: '/panel-cc', label: 'Panel operativo', icon: LayoutDashboard }]
  }

  if (rol === 'admin') {
    return [
      { href: '/admin', label: 'Administración', icon: ShieldCheck },
      { href: '/panel-cc', label: 'Panel operativo', icon: LayoutDashboard },
    ]
  }

  return [
    { href: '/login', label: 'Iniciar sesión', icon: UserRound },
  ]
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Avatar({ avatarUrl, userEmail }: { avatarUrl: string | null; userEmail: string | null }) {
  const initial = userEmail?.charAt(0).toUpperCase() || 'P'

  if (avatarUrl) {
    return (
      <span
        aria-hidden="true"
        className="h-9 w-9 rounded-full border border-outline-variant bg-cover bg-center"
        style={{ backgroundImage: `url(${avatarUrl})` }}
      />
    )
  }

  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">
      {initial}
    </span>
  )
}

export default function NavbarClient({ rol, userEmail, avatarUrl }: NavbarClientProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navItems = useMemo(() => navItemsForRole(rol), [rol])
  const isLoggedIn = Boolean(userEmail)

  // Auto-close mobile menu when viewport crosses the lg breakpoint (1024px)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')

    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      if (e.matches) {
        setOpen(false)
      }
    }

    // Check immediately in case we're already on desktop
    handleChange(mql)

    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLogo href="/" />

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {isLoggedIn ? (
            <>
              <Link
                href="/perfil"
                className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-surface-container ${
                  isActive(pathname, '/perfil') ? 'bg-primary/10' : ''
                }`}
              >
                <Avatar avatarUrl={avatarUrl} userEmail={userEmail} />
                <span className="max-w-28 truncate text-sm font-semibold text-on-surface-variant">Mi perfil</span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/registro" className="btn-primary w-auto px-4">
              Crear cuenta
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-grid place-items-center icon-button lg:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`absolute left-0 right-0 top-full z-30 border-t border-outline-variant bg-surface-container-lowest shadow-lg transition-all duration-200 ease-in-out lg:hidden ${
          open
            ? 'visible translate-y-0 opacity-100'
            : 'invisible -translate-y-2 opacity-0'
        }`}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-4 sm:px-6">
          <div className="grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {isLoggedIn && (
            <div className="grid gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <Link href="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-container-lowest">
                <Avatar avatarUrl={avatarUrl} userEmail={userEmail} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface">Mi perfil</p>
                  <p className="truncate text-xs text-on-surface-variant">{userEmail}</p>
                </div>
              </Link>
              <LogoutButton className="w-full justify-center bg-surface-container-lowest" />
            </div>
          )}

          {!isLoggedIn && (
            <Link href="/registro" onClick={() => setOpen(false)} className="btn-primary">
              Crear cuenta
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
