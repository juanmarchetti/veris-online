-- Política UPDATE faltante para que los pacientes puedan actualizar el estado de sus propios pagos (RF-03)
CREATE POLICY "Pacientes pueden actualizar sus propios pagos" ON public.pagos
FOR UPDATE USING (
  id_cita IN (
    SELECT c.id FROM public.citas c
    JOIN public.pacientes p ON c.id_paciente = p.id
    WHERE p.id_auth_user = auth.uid()
  )
);
