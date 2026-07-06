import { describe, it, expect, vi } from 'vitest'
import { generarEnlaceZoom } from '@/utils/zoom'

describe('generarEnlaceZoom', () => {
  it('retorna un enlace mock cuando ZOOM_ENABLED no está configurado', async () => {
    // Asegurar que no esté habilitado
    delete process.env.ZOOM_ENABLED

    const link = await generarEnlaceZoom('abc-123-def', '2026-07-10T10:00:00Z', 'Dolor de cabeza')
    expect(link).toContain('zoom.us/j/mock')
    expect(link).toContain('abc')
  })

  it('retorna un enlace "real" cuando ZOOM_ENABLED=true', async () => {
    process.env.ZOOM_ENABLED = 'true'

    const link = await generarEnlaceZoom('abc-123-def', '2026-07-10T10:00:00Z', 'Dolor de cabeza')
    // En la implementación actual (sin credenciales reales), retorna un enlace simulado con "real"
    expect(link).toContain('zoom.us/j/real')
    
    // Limpiar
    delete process.env.ZOOM_ENABLED
  })

  it('siempre retorna una URL válida de zoom.us', async () => {
    const link = await generarEnlaceZoom('test-id', '2026-07-10T10:00:00Z', 'Test')
    expect(link).toMatch(/^https:\/\/zoom\.us\/j\//)
  })
})
