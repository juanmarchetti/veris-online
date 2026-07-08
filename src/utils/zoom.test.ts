import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generarEnlaceZoom, ZoomApiError, _clearZoomTokenCacheForTests } from '@/utils/zoom'

// Mock de fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('generarEnlaceZoom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    _clearZoomTokenCacheForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna un enlace mock explícito cuando ZOOM_ENABLED no es "true"', async () => {
    delete process.env.ZOOM_ENABLED
    
    const link = await generarEnlaceZoom('abc-123', new Date(), 'General')
    
    expect(link).toBe('https://veris.example/mock-meeting/abc-123')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('lanza ZoomApiError si falla la obtención del token', async () => {
    process.env.ZOOM_ENABLED = 'true'
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })

    await expect(generarEnlaceZoom('abc-123', new Date(), 'General')).rejects.toThrow(ZoomApiError)
  })

  it('usa la API de Zoom y cachea el token', async () => {
    process.env.ZOOM_ENABLED = 'true'
    
    // 1er fetch: token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-token', expires_in: 3600 })
    })
    // 2do fetch: meeting
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ join_url: 'https://zoom.us/j/real123' })
    })

    const link1 = await generarEnlaceZoom('abc-123', new Date(), 'General')
    
    expect(link1).toBe('https://zoom.us/j/real123')
    expect(mockFetch).toHaveBeenCalledTimes(2)

    // Segunda llamada debe reusar el token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ join_url: 'https://zoom.us/j/real456' })
    })

    const link2 = await generarEnlaceZoom('abc-123', new Date(), 'General')
    expect(link2).toBe('https://zoom.us/j/real456')
    expect(mockFetch).toHaveBeenCalledTimes(3) // 2 de antes + 1 nueva para meeting (token cacheado)
    
    delete process.env.ZOOM_ENABLED
  })

  it('lanza ZoomApiError sin fallback silencioso si falla la creación de la reunión', async () => {
    process.env.ZOOM_ENABLED = 'true'
    
    // Avanzar el tiempo para expirar el token del test anterior si estuviera en el mismo entorno (aunque clearAllMocks limpia llamadas, no variables de módulo)
    // Para forzar nuevo token o usar el cache: mockeamos ambos por si acaso
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-token-2', expires_in: 3600 })
    })
    // Falla la creación
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request'
    })

    await expect(generarEnlaceZoom('abc-123', new Date(), 'General')).rejects.toThrow(ZoomApiError)
    
    delete process.env.ZOOM_ENABLED
  })
})
