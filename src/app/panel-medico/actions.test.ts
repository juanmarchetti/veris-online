import { describe, it, expect, vi, beforeEach } from 'vitest'
import { marcarCitaEnCurso } from './actions'
import { createClient } from '@/utils/supabase/server'
import { verificarUsuario } from '@/utils/auth'

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('@/utils/auth', () => ({
  verificarUsuario: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('panel-medico actions', () => {
  const mockSupabase = {
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('rechaza marcar cita en curso si el usuario no es médico', async () => {
    vi.mocked(verificarUsuario).mockResolvedValue({ error: 'No autorizado', status: 401, user: undefined })
    const result = await marcarCitaEnCurso('cita-1')
    expect(result).toEqual({ error: 'No autorizado.' })
  })

  it('rechaza si la cita no existe o no pertenece al médico', async () => {
    vi.mocked(verificarUsuario).mockResolvedValue({ error: undefined, user: { id: 'u1' } as any, role: 'medico' as any })
    
    // mock medicos select
    const medicosSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'm1' } })
    }
    
    // mock citas update
    const citasUpdate = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null }) // 0 filas afectadas
    }

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'medicos') return medicosSelect
      if (table === 'citas') return citasUpdate
    })

    const result = await marcarCitaEnCurso('cita-1')
    expect(result).toEqual({ error: 'No se pudo actualizar. La cita no existe o no te pertenece.' })
  })
})
