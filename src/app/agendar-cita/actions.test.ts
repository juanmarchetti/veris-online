import { describe, it, expect, vi, beforeEach } from 'vitest'
import { crearCita } from './actions'
import { createClient } from '@/utils/supabase/server'

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('agendar-cita actions', () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  })

  it('permite avanzar sin validacion manual de Contact Center', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const formData = new FormData()
    formData.append('id_especialidad', 'e1')
    formData.append('id_medico', 'm1')
    formData.append('motivo_consulta', 'test')
    formData.append('fecha', '2027-01-01')
    formData.append('hora', '10:00')

    const single = vi.fn()
      .mockResolvedValueOnce({ data: { id: 'p1', historial_clinico_veris: false }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Especialidad no encontrada' } })

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single,
    })

    const result = await crearCita(formData)

    expect(result).toEqual({ error: 'Debes tener historial clínico en Veris para agendar citas.' })
  })
})
