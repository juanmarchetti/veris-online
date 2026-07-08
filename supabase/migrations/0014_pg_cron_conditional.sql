-- supabase/migrations/0014_pg_cron_conditional.sql

-- Esta migración intenta habilitar la extensión pg_cron y programar 
-- la tarea para expirar pagos.
-- Si pg_cron no está disponible (ej. plan gratuito de Supabase que requiere
-- activación manual o plan pro), la migración atrapará el error y no fallará.
--
-- NOTA IMPORTANTE: Si pg_cron no se puede habilitar, se DEBE desplegar la Edge Function 
-- existente en supabase/functions/expirar-pagos/ usando un scheduler externo, como
-- los "Cron Jobs" desde el dashboard de Supabase (si está disponible) o un servicio 
-- de cron externo (ej. GitHub Actions, Vercel Cron, cron-job.org, etc.) llamando al webhook.

DO $$
BEGIN
  -- Intentar crear la extensión
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  
  -- Si llegamos aquí, pg_cron está disponible. Programamos el job.
  -- Se asume que la función expirar_pagos_pendientes() ya fue creada en la migración 0009
  PERFORM cron.schedule(
    'expirar-pagos-cada-minuto',
    '* * * * *',
    $$ SELECT public.expirar_pagos_pendientes() $$
  );
  
  RAISE NOTICE 'pg_cron habilitado y tarea programada exitosamente.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron no pudo ser habilitado o configurado (error: %).', SQLERRM;
    RAISE NOTICE 'Por favor, usa un scheduler externo apuntando a la Edge Function expirar-pagos.';
END $$;
