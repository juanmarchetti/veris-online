-- Migration 0009: RPC for generating Zoom links atomically

CREATE OR REPLACE FUNCTION public.registrar_enlace_zoom(
  p_id_cita uuid,
  p_enlace_zoom text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_participante boolean;
  v_enlace_final text;
BEGIN
  -- 1. Validar que quien llama es el paciente o el médico de esta cita
  SELECT EXISTS (
    SELECT 1 FROM citas c
    LEFT JOIN pacientes p ON c.id_paciente = p.id
    LEFT JOIN medicos   m ON c.id_medico   = m.id
    WHERE c.id = p_id_cita
      AND (p.id_auth_user = auth.uid() OR m.id_auth_user = auth.uid())
      AND c.estado IN ('confirmada', 'en_curso')
  ) INTO v_es_participante;

  IF NOT v_es_participante THEN
    RAISE EXCEPTION 'No autorizado o cita en estado inválido';
  END IF;

  -- 2. Escritura atómica condicionada: si otra request ya llenó el enlace
  --    milisegundos antes, esta UPDATE no afecta ninguna fila (evita el
  --    "doble meeting" cuando paciente y médico entran casi simultáneamente).
  PERFORM set_config('app.bypass_state_trigger', 'true', true);

  UPDATE citas
  SET enlace_zoom = p_enlace_zoom
  WHERE id = p_id_cita AND enlace_zoom IS NULL;

  -- 3. Devolver siempre el enlace que haya quedado en la fila
  --    (el propio, si ganó la carrera, o el de la otra request, si no)
  SELECT enlace_zoom INTO v_enlace_final FROM citas WHERE id = p_id_cita;

  RETURN v_enlace_final;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_enlace_zoom(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_enlace_zoom(uuid, text) TO authenticated;
