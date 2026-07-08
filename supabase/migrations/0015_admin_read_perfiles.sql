-- 0015_admin_read_perfiles.sql

-- Permitir a los administradores leer todos los perfiles
-- Esto soluciona el problema de que los admins no podían ver la lista de personal
-- ni contabilizar el total de pacientes/médicos desde su panel.

CREATE POLICY "Admin puede leer todos los perfiles" ON public.perfiles
FOR SELECT USING (public.get_user_role() = 'admin'::rol_enum);

-- También permitimos a los agentes de call center leer perfiles (necesario para ver pacientes)
CREATE POLICY "Agentes CC pueden leer perfiles" ON public.perfiles
FOR SELECT USING (public.get_user_role() = 'agente_cc'::rol_enum);
