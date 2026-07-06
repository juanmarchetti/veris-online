-- supabase/migrations/0010_rpc_zoom.sql

-- Modificar la función para recibir el enlace_zoom
CREATE OR REPLACE FUNCTION aprobar_pago_simulado(p_id_cita uuid, p_enlace_zoom text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owns boolean;
BEGIN
  -- Verificar que la cita pertenece al paciente autenticado
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
  SET estado_pago = 'aprobado', fecha_pago = now(), metodo_pago = 'simulado'
  WHERE id_cita = p_id_cita
    AND estado_pago = 'pendiente'
    AND fecha_limite_pago > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El pago ya no está pendiente o el plazo expiró';
  END IF;

  UPDATE citas 
  SET 
    estado = 'confirmada',
    enlace_zoom = COALESCE(p_enlace_zoom, enlace_zoom)
  WHERE id = p_id_cita;
END;
$$;
