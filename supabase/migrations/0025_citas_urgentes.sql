ALTER TABLE public.citas ADD COLUMN IF NOT EXISTS es_urgente BOOLEAN NOT NULL DEFAULT false;
ALTER TYPE estado_cita_enum ADD VALUE IF NOT EXISTS 'pendiente_aceptacion_medico';
