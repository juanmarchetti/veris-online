-- 0021_diagnosticos.sql

-- Ampliar historial_clinico para almacenar el diagnóstico estructurado
ALTER TABLE public.historial_clinico ADD COLUMN IF NOT EXISTS id_medico UUID REFERENCES public.medicos(id) ON DELETE SET NULL;
ALTER TABLE public.historial_clinico ADD COLUMN IF NOT EXISTS id_cita UUID REFERENCES public.citas(id) ON DELETE SET NULL;
ALTER TABLE public.historial_clinico ADD COLUMN IF NOT EXISTS motivo_consulta TEXT;
ALTER TABLE public.historial_clinico ADD COLUMN IF NOT EXISTS sintomas_reportados TEXT;
ALTER TABLE public.historial_clinico ADD COLUMN IF NOT EXISTS diagnostico TEXT;
ALTER TABLE public.historial_clinico ADD COLUMN IF NOT EXISTS tratamiento_indicado TEXT;
ALTER TABLE public.historial_clinico ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE public.historial_clinico ADD COLUMN IF NOT EXISTS requiere_valoracion_presencial BOOLEAN DEFAULT false;

-- Permitir a los médicos insertar diagnósticos (registros) en el historial de sus pacientes
CREATE POLICY "Médicos pueden crear diagnósticos" 
ON public.historial_clinico
FOR INSERT 
TO authenticated
WITH CHECK (
  id_medico IN (SELECT id FROM public.medicos WHERE id_auth_user = auth.uid())
);

-- Actualizar política de lectura: el paciente ya ve lo suyo. El médico puede ver 
-- lo que él mismo creó (ya está cubierto si "Médicos ven historial de sus pacientes atendidos"
-- usa id_paciente IN ...). Pero para asegurar:
CREATE POLICY "Médicos pueden ver los diagnósticos que emitieron" 
ON public.historial_clinico
FOR SELECT 
TO authenticated
USING (
  id_medico IN (SELECT id FROM public.medicos WHERE id_auth_user = auth.uid())
);
