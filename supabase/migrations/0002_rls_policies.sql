-- Seguridad a Nivel de Fila (RLS) para todas las tablas del esquema (RF-06.1)
-- Incluye la definición de permisos según perfiles de usuario.

-- Función auxiliar para obtener el rol del usuario autenticado sin generar recursividad en RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS rol_enum
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$;

-- Activación de Row Level Security en todas las tablas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_clinicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_clinico ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: perfiles
-- El propio usuario puede leer su perfil, admin puede leer/escribir todos.
CREATE POLICY "Los usuarios pueden leer su propio perfil" ON public.perfiles
FOR SELECT USING (auth.uid() = id);

-- POLÍTICAS: catálogos (especialidades, convenios, medicos)
-- Lectura pública para cualquier usuario autenticado, escritura solo para admin.
CREATE POLICY "Catálogos de lectura pública (autenticados)" ON public.especialidades
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura de catálogos solo admin" ON public.especialidades
FOR ALL USING (public.get_user_role() = 'admin'::rol_enum);

CREATE POLICY "Catálogos de lectura pública (autenticados)" ON public.convenios
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura de catálogos solo admin" ON public.convenios
FOR ALL USING (public.get_user_role() = 'admin'::rol_enum);

CREATE POLICY "Catálogos de lectura pública (autenticados)" ON public.medicos
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura de catálogos solo admin" ON public.medicos
FOR ALL USING (public.get_user_role() = 'admin'::rol_enum);

-- POLÍTICAS: pacientes
-- Cada paciente solo puede leer/actualizar su propia fila; admin y agente_cc acceso total.
CREATE POLICY "Pacientes leen su propia fila" ON public.pacientes
FOR SELECT USING (id_auth_user = auth.uid() OR public.get_user_role() IN ('admin'::rol_enum, 'agente_cc'::rol_enum));

CREATE POLICY "Pacientes pueden actualizar sus propios datos" ON public.pacientes
FOR UPDATE USING (id_auth_user = auth.uid());

CREATE POLICY "Admin y agente_cc acceso total a pacientes" ON public.pacientes
FOR ALL USING (public.get_user_role() IN ('admin'::rol_enum, 'agente_cc'::rol_enum));

-- POLÍTICAS: citas
-- Paciente dueño, médico asignado, admin y agente_cc.
CREATE POLICY "Pacientes pueden ver sus citas" ON public.citas
FOR SELECT USING (
  id_paciente IN (SELECT id FROM public.pacientes WHERE id_auth_user = auth.uid())
);
CREATE POLICY "Pacientes pueden crear citas" ON public.citas
FOR INSERT WITH CHECK (
  id_paciente IN (SELECT id FROM public.pacientes WHERE id_auth_user = auth.uid())
);
CREATE POLICY "Pacientes pueden cancelar citas (update)" ON public.citas
FOR UPDATE USING (
  id_paciente IN (SELECT id FROM public.pacientes WHERE id_auth_user = auth.uid())
);

CREATE POLICY "Médicos pueden ver sus citas asignadas" ON public.citas
FOR SELECT USING (
  id_medico IN (SELECT id FROM public.medicos WHERE id_auth_user = auth.uid())
);

CREATE POLICY "Admin y agente_cc pueden ver y modificar todas las citas" ON public.citas
FOR ALL USING (public.get_user_role() IN ('admin'::rol_enum, 'agente_cc'::rol_enum));

-- POLÍTICAS: pagos
CREATE POLICY "Pacientes pueden ver sus propios pagos" ON public.pagos
FOR SELECT USING (
  id_cita IN (
    SELECT c.id FROM public.citas c
    JOIN public.pacientes p ON c.id_paciente = p.id
    WHERE p.id_auth_user = auth.uid()
  )
);
CREATE POLICY "Pacientes pueden crear registros de pago" ON public.pagos
FOR INSERT WITH CHECK (
  id_cita IN (
    SELECT c.id FROM public.citas c
    JOIN public.pacientes p ON c.id_paciente = p.id
    WHERE p.id_auth_user = auth.uid()
  )
);
CREATE POLICY "Admin acceso total a pagos" ON public.pagos
FOR ALL USING (public.get_user_role() = 'admin'::rol_enum);

-- POLÍTICAS: documentos_clinicos
-- Visible para el paciente dueño, médico de la cita, admin.
CREATE POLICY "Pacientes ven sus documentos" ON public.documentos_clinicos
FOR SELECT USING (
  id_cita IN (
    SELECT c.id FROM public.citas c
    JOIN public.pacientes p ON c.id_paciente = p.id
    WHERE p.id_auth_user = auth.uid()
  )
);
CREATE POLICY "Médicos ven y crean documentos de sus citas" ON public.documentos_clinicos
FOR ALL USING (
  id_cita IN (
    SELECT c.id FROM public.citas c
    JOIN public.medicos m ON c.id_medico = m.id
    WHERE m.id_auth_user = auth.uid()
  )
);
CREATE POLICY "Admin ve todos los documentos" ON public.documentos_clinicos
FOR ALL USING (public.get_user_role() = 'admin'::rol_enum);

-- POLÍTICAS: historial_clinico
CREATE POLICY "Pacientes ven su historial" ON public.historial_clinico
FOR SELECT USING (
  id_paciente IN (SELECT id FROM public.pacientes WHERE id_auth_user = auth.uid())
);
CREATE POLICY "Médicos ven historial de pacientes" ON public.historial_clinico
FOR SELECT USING (
  public.get_user_role() = 'medico'::rol_enum
);
CREATE POLICY "Admin acceso total a historial" ON public.historial_clinico
FOR ALL USING (public.get_user_role() = 'admin'::rol_enum);
