-- 0022: Auditoria de validaciones de historial clinico por Contact Center

CREATE TABLE IF NOT EXISTS public.contact_center_validaciones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente     UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    id_agente       UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    estado_anterior BOOLEAN NOT NULL DEFAULT FALSE,
    estado_nuevo    BOOLEAN NOT NULL DEFAULT TRUE,
    observacion     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_validaciones_paciente
    ON public.contact_center_validaciones (id_paciente, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cc_validaciones_agente
    ON public.contact_center_validaciones (id_agente, created_at DESC);

ALTER TABLE public.contact_center_validaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agentes y admins leen validaciones CC"
    ON public.contact_center_validaciones
    FOR SELECT
    USING (public.get_user_role() IN ('agente_cc'::rol_enum, 'admin'::rol_enum));

CREATE POLICY "Agentes y admins registran validaciones CC"
    ON public.contact_center_validaciones
    FOR INSERT
    WITH CHECK (
        id_agente = auth.uid()
        AND public.get_user_role() IN ('agente_cc'::rol_enum, 'admin'::rol_enum)
    );
