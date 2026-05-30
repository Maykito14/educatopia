-- ============================================================
-- Educatopia — Tablas administrables: colegios, materias,
-- relación profesores↔materias y disponibilidad semanal
-- ============================================================

-- ── Colegios (lista administrada por el Admin) ───────────────
CREATE TABLE public.colegios (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT    NOT NULL UNIQUE,
  activo     BOOLEAN NOT NULL DEFAULT true,
  orden      INT     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.colegios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colegios visibles para todos los autenticados"
  ON public.colegios FOR SELECT
  USING (auth.uid() IS NOT NULL AND activo = true);

CREATE POLICY "Admin gestiona colegios"
  ON public.colegios FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin'));

-- Datos iniciales
INSERT INTO public.colegios (nombre, orden) VALUES
  ('Dr. Dalmacio Velez Sársfield',     1),
  ('Instituto Hermanas Mercedarias',   2),
  ('IPEM 329',                          3),
  ('IPETAYM 68',                        4),
  ('Esc. Manuel Belgrano',              5),
  ('Esc. José María Paz',               6),
  ('Esc. José Gimenez Lagos',           7),
  ('Esc. María Teresa Navarro',         8),
  ('PROA',                              9),
  ('Otros',                            10);

-- Agregar colegio_id a alumnos (opcional, puede seguir siendo texto libre)
ALTER TABLE public.alumnos
  ADD COLUMN colegio_id UUID REFERENCES public.colegios(id) ON DELETE SET NULL;

-- Separar nombre en nombre + apellido
ALTER TABLE public.alumnos
  ADD COLUMN apellido TEXT NOT NULL DEFAULT '';

-- ── Materias (lista administrada, asociada a nivel) ──────────
CREATE TABLE public.materias (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT    NOT NULL,
  nivel      TEXT    NOT NULL CHECK (nivel IN ('primario','secundario','terciario','taller','todos')),
  activo     BOOLEAN NOT NULL DEFAULT true,
  orden      INT     NOT NULL DEFAULT 0,
  UNIQUE (nombre, nivel),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materias visibles para todos los autenticados"
  ON public.materias FOR SELECT
  USING (auth.uid() IS NOT NULL AND activo = true);

CREATE POLICY "Admin gestiona materias"
  ON public.materias FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin'));

-- Datos iniciales
INSERT INTO public.materias (nombre, nivel, orden) VALUES
  ('Lengua',             'primario',    1),
  ('Matemática',         'primario',    2),
  ('Inglés',             'primario',    3),
  ('Ciencias Naturales', 'primario',    4),
  ('Ciencias Sociales',  'primario',    5),
  ('Matemática',         'secundario',  1),
  ('Lengua',             'secundario',  2),
  ('Inglés',             'secundario',  3),
  ('Física',             'secundario',  4),
  ('Química',            'secundario',  5),
  ('Historia',           'secundario',  6),
  ('Geografía',          'secundario',  7),
  ('Biología',           'secundario',  8),
  ('Contabilidad',       'secundario',  9),
  ('Computación',        'secundario', 10),
  ('Portugués',          'secundario', 11),
  ('Matemática',         'terciario',   1),
  ('Inglés',             'terciario',   2),
  ('Contabilidad',       'terciario',   3),
  ('Computación',        'terciario',   4),
  ('Portugués',          'terciario',   5),
  ('Computación',        'taller',      1),
  ('Inglés',             'taller',      2);

-- ── Profesores ↔ Materias (qué da cada profesor) ────────────
CREATE TABLE public.profesores_materias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  materia_id  UUID NOT NULL REFERENCES public.materias(id)  ON DELETE CASCADE,
  UNIQUE (profesor_id, materia_id)
);

ALTER TABLE public.profesores_materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible para autenticados"
  ON public.profesores_materias FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin gestiona"
  ON public.profesores_materias FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin'));

-- ── Disponibilidad semanal del profesor ─────────────────────
-- dia_semana: 0=domingo … 6=sábado
CREATE TABLE public.profesores_disponibilidad (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id      UUID    NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  dia_semana       INT     NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio      TIME    NOT NULL,
  hora_fin         TIME    NOT NULL,
  duracion_minutos INT     NOT NULL CHECK (duracion_minutos IN (60, 90, 120)),
  activo           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hora_fin_after_inicio CHECK (hora_fin > hora_inicio)
);

ALTER TABLE public.profesores_disponibilidad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible para autenticados"
  ON public.profesores_disponibilidad FOR SELECT
  USING (auth.uid() IS NOT NULL AND activo = true);

CREATE POLICY "Admin y profesor gestionan"
  ON public.profesores_disponibilidad FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin') OR
    EXISTS (
      SELECT 1 FROM public.profesores
      WHERE id = profesores_disponibilidad.profesor_id AND profile_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX idx_prof_disp_dia ON public.profesores_disponibilidad(profesor_id, dia_semana);
CREATE INDEX idx_prof_mat_prof  ON public.profesores_materias(profesor_id);
CREATE INDEX idx_prof_mat_mat   ON public.profesores_materias(materia_id);
CREATE INDEX idx_colegios_orden ON public.colegios(orden) WHERE activo = true;
