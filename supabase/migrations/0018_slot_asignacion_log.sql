-- 0018: Tabla de trazabilidad para el módulo de agendamiento automático FIFO
-- Registra qué slot fue asignado, por qué, y si se usó una alternativa

CREATE TABLE IF NOT EXISTS public.slot_asignacion_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cita             UUID REFERENCES public.citas(id) ON DELETE SET NULL,
    id_medico           UUID NOT NULL REFERENCES public.medicos(id) ON DELETE CASCADE,
    id_paciente         UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    dias_solicitados    DATE[] NOT NULL,           -- días que el paciente seleccionó
    slot_asignado       TIMESTAMPTZ NOT NULL,      -- fecha+hora final asignada
    es_alternativa      BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE si el slot viene de búsqueda automática
    medico_alternativo  BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE si se asignó a otro médico
    razon               TEXT,                      -- descripción del criterio usado (para auditoría)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para consultas de auditoría por médico y fecha
CREATE INDEX IF NOT EXISTS idx_slot_log_medico_fecha
    ON public.slot_asignacion_log (id_medico, slot_asignado);

CREATE INDEX IF NOT EXISTS idx_slot_log_paciente
    ON public.slot_asignacion_log (id_paciente);

-- RLS: solo admins pueden leer los logs; el sistema escribe via service_role
ALTER TABLE public.slot_asignacion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_read_slot_logs"
    ON public.slot_asignacion_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol = 'admin'::public.rol_enum
        )
    );
