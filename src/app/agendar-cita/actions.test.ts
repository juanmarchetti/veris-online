import { describe, it, expect, vi, beforeEach } from 'vitest'
import { crearCita } from './actions'
import { createClient } from '@/utils/supabase/server'

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

describe('agendar-cita actions', () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('bloquea la creación de cita si historial_clinico_veris es falso', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    
    const formData = new FormData()
    formData.append('id_especialidad', 'e1')
    formData.append('id_medico', 'm1')
    formData.append('motivo_consulta', 'test')
    formData.append('fecha', '2027-01-01')
    formData.append('hora', '10:00')
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'p1', historial_clinico_veris: false } })
    })

    const result = await crearCita(formData)

    expect(result).toEqual({ error: 'Debes comunicarte al Contact Center (6009600) para registrar tu historial clínico antes de poder agendar.' })
  })
})
