CREATE POLICY "Médicos pueden actualizar sus citas asignadas" ON public.citas
FOR UPDATE USING (
  id_medico IN (SELECT id FROM public.medicos WHERE id_auth_user = auth.uid())
);
