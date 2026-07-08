-- 0019_perfiles_avatar_y_pagos.sql

-- 1. Añadir avatar_url a perfiles
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Tabla para configuración bancaria del administrador (dónde recibe pagos)
CREATE TABLE IF NOT EXISTS public.configuracion_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_admin UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    titular_cuenta TEXT NOT NULL,
    numero_cuenta TEXT NOT NULL,
    banco TEXT NOT NULL,
    tipo_cuenta TEXT NOT NULL,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para configuracion_admin
ALTER TABLE public.configuracion_admin ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden leer la cuenta (para procesar el pago o mostrarla)
CREATE POLICY "Lectura configuracion_admin para autenticados" 
ON public.configuracion_admin FOR SELECT 
TO authenticated 
USING (true);

-- Solo los admins pueden insertar/actualizar su propia configuración
CREATE POLICY "Manejo configuracion_admin para admins" 
ON public.configuracion_admin FOR ALL 
TO authenticated 
USING (
  (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'admin'::rol_enum
)
WITH CHECK (
  (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'admin'::rol_enum
);

-- 3. Crear el bucket 'avatars' en Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS para el bucket 'avatars'
-- Permitir lectura pública de los avatares
CREATE POLICY "Avatares publicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permitir a usuarios autenticados subir avatares
CREATE POLICY "Usuarios pueden subir su propio avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- Permitir a usuarios autenticados actualizar su propio avatar
CREATE POLICY "Usuarios pueden actualizar su propio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- Permitir a usuarios autenticados eliminar su propio avatar
CREATE POLICY "Usuarios pueden eliminar su propio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);
