-- 1. Agregar política de INSERT faltante para pacientes
CREATE POLICY "Pacientes pueden crear su propia fila" ON public.pacientes
FOR INSERT WITH CHECK (id_auth_user = auth.uid());

-- 2. Corregir política de SELECT para historial_clinico de médicos
DROP POLICY IF EXISTS "Médicos ven historial de pacientes" ON public.historial_clinico;

CREATE POLICY "Médicos ven historial de sus pacientes atendidos" ON public.historial_clinico
FOR SELECT USING (
  id_paciente IN (
    SELECT c.id_paciente FROM public.citas c
    JOIN public.medicos m ON c.id_medico = m.id
    WHERE m.id_auth_user = auth.uid()
  )
);
