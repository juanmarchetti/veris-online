-- Agregar columnas de horario a la tabla medicos
ALTER TABLE public.medicos 
ADD COLUMN IF NOT EXISTS dias_laborables INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
ADD COLUMN IF NOT EXISTS hora_entrada TIME NOT NULL DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS hora_salida TIME NOT NULL DEFAULT '17:00:00';

-- Agregar columnas de duracion e informe a la tabla citas
ALTER TABLE public.citas
ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS informe_medico TEXT;
