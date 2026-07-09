-- 0024: Metadatos para pasarela sandbox y futura pasarela real

ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS proveedor_pago TEXT,
  ADD COLUMN IF NOT EXISTS referencia_pago TEXT,
  ADD COLUMN IF NOT EXISTS ambiente_pago TEXT NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS detalle_pago JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_pagos_referencia_pago
  ON public.pagos (referencia_pago);

CREATE OR REPLACE FUNCTION aprobar_pago_sandbox(
  p_id_cita uuid,
  p_enlace_zoom text DEFAULT NULL,
  p_metodo_pago text DEFAULT 'sandbox',
  p_referencia_pago text DEFAULT NULL,
  p_ambiente_pago text DEFAULT 'sandbox',
  p_detalle_pago jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owns boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM citas c
    JOIN pacientes p ON c.id_paciente = p.id
    WHERE c.id = p_id_cita AND p.id_auth_user = auth.uid()
  ) INTO v_owns;

  IF NOT v_owns THEN
    RAISE EXCEPTION 'No autorizado: esta cita no pertenece al usuario autenticado';
  END IF;

  PERFORM set_config('app.bypass_state_trigger', 'true', true);

  UPDATE pagos
  SET
    estado_pago = 'aprobado',
    fecha_pago = now(),
    metodo_pago = p_metodo_pago,
    proveedor_pago = COALESCE(p_metodo_pago, 'sandbox'),
    referencia_pago = p_referencia_pago,
    ambiente_pago = p_ambiente_pago,
    detalle_pago = COALESCE(p_detalle_pago, '{}'::jsonb)
  WHERE id_cita = p_id_cita
    AND estado_pago = 'pendiente'
    AND fecha_limite_pago > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El pago ya no esta pendiente o el plazo expiro';
  END IF;

  UPDATE citas
  SET
    estado = 'confirmada',
    enlace_zoom = COALESCE(p_enlace_zoom, enlace_zoom)
  WHERE id = p_id_cita;
END;
$$;

REVOKE EXECUTE ON FUNCTION aprobar_pago_sandbox(uuid, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aprobar_pago_sandbox(uuid, text, text, text, text, jsonb) TO authenticated;
