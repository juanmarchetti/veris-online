DROP FUNCTION IF EXISTS public.aceptar_cita_urgente(UUID);

CREATE OR REPLACE FUNCTION public.aceptar_cita_urgente(p_id_cita UUID)
RETURNS TABLE (
  out_id_cita UUID,
  out_id_paciente UUID,
  out_nueva_fecha_hora TIMESTAMPTZ,
  out_minutos_retraso INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cita_urgente RECORD;
  v_ahora TIMESTAMPTZ := NOW();
  v_duracion INT;
  v_desplazada RECORD;
  v_interval INTERVAL;
  v_precio NUMERIC;
  v_monto NUMERIC;
BEGIN
  -- 1. Validar la cita urgente
  SELECT * INTO v_cita_urgente
  FROM public.citas
  WHERE id = p_id_cita AND es_urgente = true AND estado = 'pendiente_aceptacion_medico'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cita urgente no encontrada o no está pendiente de aceptación.';
  END IF;

  -- 2. Validar ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = v_cita_urgente.id_medico AND m.id_auth_user = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  v_duracion := COALESCE(v_cita_urgente.duracion_minutos, 30);
  v_interval := (v_duracion || ' minutes')::interval;

  -- 3. Actualizar cita urgente
  UPDATE public.citas
  SET fecha_hora = v_ahora, estado = 'confirmada'
  WHERE id = p_id_cita;

  -- 4. Desplazar citas posteriores
  CREATE TEMP TABLE temp_desplazamientos (
    out_id_cita UUID,
    out_id_paciente UUID,
    out_nueva_fecha_hora TIMESTAMPTZ,
    out_minutos_retraso INT
  ) ON COMMIT DROP;

  FOR v_desplazada IN
    SELECT c.id, c.id_paciente, c.fecha_hora, c.estado
    FROM public.citas c
    WHERE c.id_medico = v_cita_urgente.id_medico
      AND c.id != p_id_cita
      AND c.estado IN ('confirmada', 'en_curso', 'pendiente_pago')
      AND c.fecha_hora >= v_ahora
    ORDER BY c.fecha_hora ASC
    FOR UPDATE
  LOOP
    UPDATE public.citas
    SET fecha_hora = c.fecha_hora + v_interval
    WHERE id = v_desplazada.id;

    IF v_desplazada.estado = 'pendiente_pago' THEN
      UPDATE public.pagos
      SET fecha_limite_pago = fecha_limite_pago + v_interval
      WHERE id_cita = v_desplazada.id AND estado_pago = 'pendiente';
    END IF;

    INSERT INTO temp_desplazamientos VALUES (
      v_desplazada.id, 
      v_desplazada.id_paciente, 
      v_desplazada.fecha_hora + v_interval, 
      v_duracion
    );
  END LOOP;

  -- 5. Pago de cita urgente
  SELECT precio_base INTO v_precio FROM public.especialidades WHERE id = v_cita_urgente.id_especialidad;
  v_monto := (v_precio / 60) * v_duracion;
  
  UPDATE public.pagos
  SET estado_pago = 'aprobado', monto = v_monto
  WHERE id_cita = p_id_cita;
  
  IF NOT FOUND THEN
    INSERT INTO public.pagos (id_cita, monto, fecha_limite_pago, estado_pago)
    VALUES (p_id_cita, v_monto, NOW(), 'aprobado');
  END IF;

  RETURN QUERY SELECT * FROM temp_desplazamientos;
END;
$$;

CREATE OR REPLACE FUNCTION public.rechazar_cita_urgente(p_id_cita UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cita_urgente RECORD;
  v_ultima_cita RECORD;
  v_nuevo_slot TIMESTAMPTZ;
BEGIN
  -- 1. Validar
  SELECT * INTO v_cita_urgente
  FROM public.citas
  WHERE id = p_id_cita AND es_urgente = true AND estado = 'pendiente_aceptacion_medico'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cita urgente no encontrada o no está pendiente de aceptación.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = v_cita_urgente.id_medico AND m.id_auth_user = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  -- 3. Buscar la última cita
  SELECT * INTO v_ultima_cita
  FROM public.citas
  WHERE id_medico = v_cita_urgente.id_medico
    AND estado NOT IN ('cancelada')
    AND id != p_id_cita
    AND fecha_hora::date = NOW()::date
  ORDER BY fecha_hora DESC
  LIMIT 1;

  IF FOUND THEN
    v_nuevo_slot := v_ultima_cita.fecha_hora + (COALESCE(v_ultima_cita.duracion_minutos, 60) || ' minutes')::interval + '30 minutes'::interval;
  ELSE
    v_nuevo_slot := NOW() + '30 minutes'::interval;
  END IF;

  -- 4. Actualizar cita
  UPDATE public.citas
  SET fecha_hora = v_nuevo_slot, estado = 'pendiente_pago'
  WHERE id = p_id_cita;

  -- 5. Extender pago
  UPDATE public.pagos
  SET fecha_limite_pago = NOW() + '30 minutes'::interval
  WHERE id_cita = p_id_cita;

  RETURN v_nuevo_slot;
END;
$$;
