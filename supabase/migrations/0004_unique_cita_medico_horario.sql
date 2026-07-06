-- Restricción única para evitar doble reserva del mismo médico a la misma hora (RF-02)
ALTER TABLE public.citas ADD CONSTRAINT unique_medico_horario UNIQUE (id_medico, fecha_hora);
