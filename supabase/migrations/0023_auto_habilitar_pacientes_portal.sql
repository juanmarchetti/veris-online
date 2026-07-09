-- 0023: Automatizar habilitacion de agendamiento para pacientes del portal
-- El Contact Center deja de ser un paso obligatorio del flujo digital.

ALTER TABLE public.pacientes
  ALTER COLUMN historial_clinico_veris SET DEFAULT TRUE;

UPDATE public.pacientes
SET historial_clinico_veris = TRUE
WHERE historial_clinico_veris = FALSE;
