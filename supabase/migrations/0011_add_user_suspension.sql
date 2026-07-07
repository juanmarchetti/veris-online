-- 1. Agregar columna de suspensión a la tabla perfiles
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

-- Comentario para documentación
COMMENT ON COLUMN public.perfiles.activo IS 'Si es false, el usuario está suspendido y no puede acceder a las rutas protegidas.';
