import { describe, it, expect, vi, beforeEach } from 'vitest'
import { procesarPagoSandbox } from './actions'
import { createClient } from '@/utils/supabase/server'
import { generarEnlaceZoom } from '@/utils/zoom'

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

vi.mock('@/utils/zoom', () => ({
  generarEnlaceZoom: vi.fn()
}))

vi.mock('@/utils/resend', () => ({
  enviarCorreoConfirmacion: vi.fn()
}))

describe('pago actions - procesarPagoSandbox', () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  })

  it('no rompe el pago si zoom falla (try/catch)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { fecha_hora: '2026-01-01', motivo_consulta: 'test' } })
    })

    mockSupabase.rpc.mockResolvedValue({ error: null })

    // Zoom lanza error
    vi.mocked(generarEnlaceZoom).mockRejectedValue(new Error('Zoom API Error mock'))

    const result = await procesarPagoSandbox('cita-123', {
      last4: '4242',
      titular: 'PACIENTE PRUEBA',
      marca: 'visa-test'
    })

    expect(result).toEqual({
      success: true,
      referenciaPago: expect.stringMatching(/^SBX-/)
    })
    expect(mockSupabase.rpc).toHaveBeenCalledWith('aprobar_pago_sandbox', {
      p_id_cita: 'cita-123',
      p_enlace_zoom: null,
      p_metodo_pago: 'sandbox',
      p_referencia_pago: expect.stringMatching(/^SBX-/),
      p_ambiente_pago: 'sandbox',
      p_detalle_pago: {
        origen: 'checkout_sandbox',
        last4: '4242',
        titular: 'PACIENTE PRUEBA',
        marca: 'visa-test'
      }
    })
  })
})
