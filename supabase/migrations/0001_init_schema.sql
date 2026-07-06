-- RF-01: Registro e ingreso / Tabla Perfiles y Autenticación
-- Crea los enums requeridos según el modelo de datos (Sección 7 del SRS)

CREATE TYPE rol_enum AS ENUM ('paciente', 'medico', 'agente_cc', 'admin');
CREATE TYPE estado_cita_enum AS ENUM ('agendada', 'pendiente_pago', 'confirmada', 'en_curso', 'finalizada', 'cancelada');
CREATE TYPE estado_pago_enum AS ENUM ('pendiente', 'aprobado', 'rechazado', 'expirado');
CREATE TYPE tipo_documento_enum AS ENUM ('receta', 'orden_servicio', 'recomendacion', 'certificado');

-- TABLA: perfiles (extensión de auth.users para roles)
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol rol_enum NOT NULL DEFAULT 'paciente'::rol_enum,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente al registrar un nuevo usuario (RF-01.2)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, rol)
  VALUES (new.id, 'paciente'::rol_enum);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- TABLAS DE CATÁLOGOS (RF-02.3 y RN-01)
CREATE TABLE public.especialidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE public.convenios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_aseguradora TEXT NOT NULL UNIQUE
);

-- TABLAS DE USUARIOS/ACTORES
CREATE TABLE public.medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT NOT NULL,
    id_especialidad UUID NOT NULL REFERENCES public.especialidades(id) ON DELETE RESTRICT,
    id_auth_user UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Referencia opcional si el médico inicia sesión
);

CREATE TABLE public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_identificacion TEXT NOT NULL,
    numero_identificacion TEXT NOT NULL UNIQUE,
    nombre_completo TEXT NOT NULL,
    correo TEXT NOT NULL,
    telefono TEXT,
    cuenta_registrada_portal BOOLEAN NOT NULL DEFAULT FALSE,
    historial_clinico_veris BOOLEAN NOT NULL DEFAULT FALSE,
    id_auth_user UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE
);

-- TABLA: citas (RF-02)
CREATE TABLE public.citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    id_medico UUID NOT NULL REFERENCES public.medicos(id) ON DELETE RESTRICT,
    id_especialidad UUID NOT NULL REFERENCES public.especialidades(id) ON DELETE RESTRICT,
    id_convenio UUID REFERENCES public.convenios(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMPTZ NOT NULL,
    motivo_consulta TEXT NOT NULL,
    estado estado_cita_enum NOT NULL DEFAULT 'agendada'::estado_cita_enum,
    enlace_zoom TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    canal_origen TEXT NOT NULL DEFAULT 'Web',
    requiere_valoracion_presencial BOOLEAN NOT NULL DEFAULT FALSE
);

-- TABLA: pagos (RF-03)
CREATE TABLE public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cita UUID NOT NULL REFERENCES public.citas(id) ON DELETE CASCADE UNIQUE,
    monto NUMERIC(10, 2) NOT NULL,
    fecha_limite_pago TIMESTAMPTZ NOT NULL,
    fecha_pago TIMESTAMPTZ,
    estado_pago estado_pago_enum NOT NULL DEFAULT 'pendiente'::estado_pago_enum,
    metodo_pago TEXT
);

-- TABLA: documentos_clinicos (RF-05)
CREATE TABLE public.documentos_clinicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cita UUID NOT NULL REFERENCES public.citas(id) ON DELETE CASCADE,
    tipo_documento tipo_documento_enum NOT NULL,
    fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    url_archivo TEXT NOT NULL
);

-- TABLA: historial_clinico (RF-07)
CREATE TABLE public.historial_clinico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    tipo_registro TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referencia_documento UUID REFERENCES public.documentos_clinicos(id) ON DELETE SET NULL
);
