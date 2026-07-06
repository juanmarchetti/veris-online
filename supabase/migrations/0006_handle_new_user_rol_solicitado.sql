-- Fix #2 (RF-01.2): Reemplazar función handle_new_user para soportar rol programático
-- desde app_metadata (solo setteable vía Admin API / createAdminClient, NUNCA desde el cliente público).
--
-- SEGURIDAD: Se lee raw_app_meta_data->>'rol_solicitado', NO raw_user_meta_data.
-- raw_user_meta_data es controlable por el usuario en el signUp público (options.data),
-- lo que crearía un hueco de escalada de privilegios. raw_app_meta_data solo puede
-- ser escrito con la service_role key — jamás desde el navegador.
--
-- FLUJO PÚBLICO (/registro): no setea app_metadata → siempre cae a 'paciente' (comportamiento seguro).
-- FLUJO ADMIN (createAdminClient): puede pasar { app_metadata: { rol_solicitado: 'medico' } }
-- al crear un usuario programáticamente, y el trigger asignará ese rol desde el inicio.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  rol_a_asignar rol_enum;
  rol_raw TEXT;
BEGIN
  -- Leer rol_solicitado SOLO desde app_metadata (controlado por la Admin API)
  rol_raw := new.raw_app_meta_data->>'rol_solicitado';

  -- Validar que sea un valor válido del enum antes de asignarlo
  -- (protección adicional contra valores inesperados en app_metadata)
  IF rol_raw IN ('paciente', 'medico', 'agente_cc', 'admin') THEN
    rol_a_asignar := rol_raw::rol_enum;
  ELSE
    -- Default seguro: todo usuario creado sin rol_solicitado válido es paciente
    rol_a_asignar := 'paciente'::rol_enum;
  END IF;

  INSERT INTO public.perfiles (id, rol)
  VALUES (new.id, rol_a_asignar);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
