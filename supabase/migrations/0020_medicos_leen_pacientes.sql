-- 0020_medicos_leen_pacientes.sql

-- Eliminar la política anterior si existe para evitar el error de recursión infinita
DROP POLICY IF EXISTS "Médicos leen datos de sus pacientes con cita" ON public.pacientes;
DROP POLICY IF EXISTS "Médicos leen todos los pacientes" ON public.pacientes;

-- Permitir a los médicos leer pacientes usando la función get_user_role() que no genera recursión
CREATE POLICY "Médicos leen todos los pacientes" 
ON public.pacientes
FOR SELECT 
TO authenticated
USING (
  public.get_user_role() = 'medico'::rol_enum
);
