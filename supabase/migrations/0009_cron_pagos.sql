-- supabase/migrations/0009_cron_pagos.sql

-- NOTA IMPORTANTE: Verificación de pg_cron
-- Antes de habilitar este cron, ejecuta en tu panel de Supabase:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Si recibes un error de permisos, significa que pg_cron no está disponible en tu plan.
-- En ese caso, NO apliques este cron y utiliza la Edge Function proporcionada en supabase/functions/expirar-pagos/

CREATE OR REPLACE FUNCTION expirar_pagos_pendientes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Marcar pagos como expirados
    UPDATE pagos
    SET estado_pago = 'expirado'
    WHERE estado_pago = 'pendiente'
      AND fecha_limite_pago < now();
      
    -- Cancelar citas huérfanas vinculadas a pagos expirados
    UPDATE citas
    SET estado = 'cancelada'
    WHERE id IN (
        SELECT id_cita FROM pagos WHERE estado_pago = 'expirado'
    ) AND estado = 'pendiente_pago';
END;
$$;

-- Descomenta las siguientes líneas SOLO si pg_cron está disponible:
-- SELECT cron.schedule('expirar_pagos_minuto', '* * * * *', 'SELECT expirar_pagos_pendientes()');
