import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/utils/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Veris Online',
    short_name: 'Veris',
    description: 'Portal web para videoconsultas, agenda médica e historial clínico digital.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f9fb',
    theme_color: '#003d79',
    categories: ['health', 'medical', 'productivity'],
    lang: 'es-EC',
    icons: [
      {
        src: `${getSiteUrl()}/icon.svg`,
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
