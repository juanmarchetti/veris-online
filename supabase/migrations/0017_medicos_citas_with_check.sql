-- supabase/migrations/0017_medicos_citas_with_check.sql

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
        IF NEW.fecha_hora != OLD.fecha_hora OR NEW.id_medico != OLD.id_medico THEN
            RAISE EXCEPTION 'Pacientes no pueden modificar fecha u horario ni médico';
        END IF;
        IF NEW.duracion_minutos != OLD.duracion_minutos OR NEW.enlace_zoom IS DISTINCT FROM OLD.enlace_zoom THEN
            RAISE EXCEPTION 'Pacientes no pueden modificar campos internos de la cita';
        END IF;
    END IF;

    -- Lógica restrictiva para el médico (API REST directa)
    IF public.get_user_role() = 'medico'::public.rol_enum THEN
        -- El médico puede cambiar estado de 'confirmada' a 'en_curso', de 'en_curso' a 'finalizada', o de 'confirmada' a 'finalizada'
        IF NEW.estado != OLD.estado THEN
            IF NOT (
                (OLD.estado = 'confirmada' AND NEW.estado = 'en_curso') OR
                (OLD.estado = 'en_curso' AND NEW.estado = 'finalizada') OR
                (OLD.estado = 'confirmada' AND NEW.estado = 'finalizada')
            ) THEN
                RAISE EXCEPTION 'Médicos solo pueden pasar citas a en_curso o finalizada';
            END IF;
        END IF;

        -- No puede cambiar los datos fundamentales de la cita
        IF NEW.fecha_hora != OLD.fecha_hora 
           OR NEW.id_paciente != OLD.id_paciente 
           OR NEW.id_medico != OLD.id_medico 
           OR NEW.enlace_zoom IS DISTINCT FROM OLD.enlace_zoom 
           OR NEW.duracion_minutos != OLD.duracion_minutos THEN
            RAISE EXCEPTION 'Médicos no pueden modificar detalles fundamentales de la cita (fecha, paciente, médico, zoom)';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
