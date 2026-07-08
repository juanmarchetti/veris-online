-- 0020_medicos_leen_pacientes.sql

-- Permitir a los médicos leer la fila completa de pacientes con los que tienen citas asignadas
CREATE POLICY "Médicos leen datos de sus pacientes con cita" 
ON public.pacientes
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT id_paciente 
    FROM public.citas 
    WHERE id_medico IN (
      SELECT id FROM public.medicos WHERE id_auth_user = auth.uid()
    )
  )
);
