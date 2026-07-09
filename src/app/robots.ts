import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/utils/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/registro', '/ayuda'],
        disallow: [
          '/admin',
          '/agendar-cita',
          '/api',
          '/inicio',
          '/mis-citas',
          '/pago',
          '/panel-cc',
          '/panel-medico',
          '/perfil',
          '/videoconsulta',
        ],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}
