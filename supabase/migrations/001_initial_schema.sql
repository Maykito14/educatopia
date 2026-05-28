-- ============================================================
-- Educatopia — Esquema inicial
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: profiles
-- Extiende auth.users de Supabase
-- ============================================================
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  telefono   TEXT,
  rol        TEXT NOT NULL CHECK (rol IN ('alumno', 'padre', 'profesor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin ve todos los perfiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Usuario actualiza su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'alumno')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- TABLA: alumnos
-- Perfil académico del estudiante
-- ============================================================
CREATE TABLE public.alumnos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tutor_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nombre            TEXT NOT NULL,
  edad              INT CHECK (edad BETWEEN 4 AND 80),
  nivel_educativo   TEXT CHECK (nivel_educativo IN ('primario', 'secundario', 'terciario', 'taller')),
  anio_grado        TEXT,
  colegio           TEXT,
  telefono_contacto TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumno o tutor ve sus propios datos"
  ON public.alumnos FOR SELECT
  USING (
    profile_id = auth.uid() OR
    tutor_id   = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin', 'profesor'))
  );

CREATE POLICY "Admin gestiona alumnos"
  ON public.alumnos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );


-- ============================================================
-- TABLA: profesores
-- ============================================================
CREATE TABLE public.profesores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nombre     TEXT NOT NULL,
  materias   TEXT[] NOT NULL DEFAULT '{}',
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profesores visibles para todos los autenticados"
  ON public.profesores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin gestiona profesores"
  ON public.profesores FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );


-- ============================================================
-- TABLA: slots
-- Bloques de disponibilidad creados por el profesor
-- ============================================================
CREATE TABLE public.slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id      UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  fecha            DATE NOT NULL,
  hora_inicio      TIME NOT NULL,
  hora_fin         TIME NOT NULL,
  duracion_minutos INT  NOT NULL CHECK (duracion_minutos IN (60, 90, 120)),
  capacidad_max    INT  NOT NULL DEFAULT 4 CHECK (capacidad_max BETWEEN 1 AND 4),
  estado           TEXT NOT NULL DEFAULT 'disponible'
                   CHECK (estado IN ('disponible', 'lleno', 'cancelado')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hora_fin_after_inicio CHECK (hora_fin > hora_inicio)
);

ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slots visibles para todos los autenticados"
  ON public.slots FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Profesor gestiona sus propios slots"
  ON public.slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profesores
      WHERE id = slots.profesor_id AND profile_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );


-- ============================================================
-- TABLA: turnos
-- Reserva de un alumno en un slot
-- ============================================================
CREATE TABLE public.turnos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id        UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  alumno_id      UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  materia        TEXT NOT NULL,
  anio           TEXT NOT NULL,
  colegio        TEXT NOT NULL,
  objetivo       TEXT,
  estado         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'confirmado', 'cancelado', 'completado')),
  solicitado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notas          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slot_id, alumno_id)
);

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumno o tutor ve sus turnos"
  ON public.turnos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alumnos
      WHERE id = turnos.alumno_id AND (profile_id = auth.uid() OR tutor_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin', 'profesor'))
  );

CREATE POLICY "Alumno o tutor crea turno"
  ON public.turnos FOR INSERT
  WITH CHECK (solicitado_por = auth.uid());

CREATE POLICY "Admin o profesor gestiona turnos"
  ON public.turnos FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin', 'profesor'))
  );


-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_turnos_alumno   ON public.turnos(alumno_id);
CREATE INDEX idx_turnos_slot     ON public.turnos(slot_id);
CREATE INDEX idx_slots_fecha     ON public.slots(profesor_id, fecha);
CREATE INDEX idx_turnos_grouping ON public.turnos(slot_id, materia, anio, colegio);
