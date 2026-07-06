-- supabase/migrations/0007_fix_rls_write_check.sql

-- Función RPC para aprobar pago simulado
CREATE OR REPLACE FUNCTION aprobar_pago_simulado(p_id_cita uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owns boolean;
BEGIN
  -- Verificar que la cita pertenece al paciente autenticado que invoca
  SELECT EXISTS (
    SELECT 1 FROM citas c
    JOIN pacientes p ON c.id_paciente = p.id
    WHERE c.id = p_id_cita AND p.id_auth_user = auth.uid()
  ) INTO v_owns;

  IF NOT v_owns THEN
    RAISE EXCEPTION 'No autorizado: esta cita no pertenece al usuario autenticado';
  END IF;

  PERFORM set_config('app.bypass_state_trigger', 'true', true);

  -- Solo aprobar si el pago sigue pendiente y no expirado (evita doble-procesamiento y race con el cron)
  UPDATE pagos
  SET estado_pago = 'aprobado', fecha_pago = now(), metodo_pago = 'simulado'
  WHERE id_cita = p_id_cita
    AND estado_pago = 'pendiente'
    AND fecha_limite_pago > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El pago ya no está pendiente o el plazo expiró';
  END IF;

  UPDATE citas SET estado = 'confirmada' WHERE id = p_id_cita;
END;
$$;

-- Restringir quién puede ejecutarla
REVOKE EXECUTE ON FUNCTION aprobar_pago_simulado(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aprobar_pago_simulado(uuid) TO authenticated;

-- Trigger para pagos
CREATE OR REPLACE FUNCTION trg_check_pago_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si viene de la RPC, permitimos el cambio
    IF current_setting('app.bypass_state_trigger', true) = 'true' THEN
        RETURN NEW;
    END IF;

    -- Lógica restrictiva para el paciente (API REST directa)
    IF public.get_user_role() = 'paciente'::public.rol_enum AND NEW.estado_pago = 'aprobado' THEN
        RAISE EXCEPTION 'No autorizado para aprobar pagos directamente';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pagos_before_update ON pagos;
CREATE TRIGGER trg_pagos_before_update
BEFORE UPDATE ON pagos
FOR EACH ROW
EXECUTE FUNCTION trg_check_pago_update();


-- Trigger para citas
CREATE OR REPLACE FUNCTION trg_check_cita_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si viene de la RPC, permitimos el cambio
    IF current_setting('app.bypass_state_trigger', true) = 'true' THEN
        RETURN NEW;
    END IF;

    -- Lógica restrictiva para el paciente (API REST directa)
    -- Solo puede cancelar citas
    IF public.get_user_role() = 'paciente'::public.rol_enum THEN
        IF NEW.estado != 'cancelada' AND OLD.estado != NEW.estado THEN
            RAISE EXCEPTION 'Pacientes solo pueden cambiar el estado a cancelada';
        END IF;
        -- Aquí también podríamos prevenir cambios a fecha_hora, id_medico, etc.
        IF NEW.fecha_hora != OLD.fecha_hora OR NEW.id_medico != OLD.id_medico THEN
            RAISE EXCEPTION 'Pacientes no pueden modificar fecha u horario ni médico';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_citas_before_update ON citas;
CREATE TRIGGER trg_citas_before_update
BEFORE UPDATE ON citas
FOR EACH ROW
EXECUTE FUNCTION trg_check_cita_update();
