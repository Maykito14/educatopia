-- ============================================================
-- Educatopia — Precios, Packs y políticas admin completas
-- ============================================================

-- ── 1. Tabla precios por nivel ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.precios (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel                 TEXT    NOT NULL UNIQUE
                                CHECK (nivel IN ('primario','secundario','terciario','taller')),
  valor_hora            NUMERIC(10,2) NOT NULL DEFAULT 0,
  porcentaje_profesor   NUMERIC(5,2)  NOT NULL DEFAULT 50,
  pack_semanal_precio   NUMERIC(10,2),   -- solo primario
  pack_mensual_precio   NUMERIC(10,2),   -- primario y secundario
  pack_horas_semana     INT,             -- clases por semana incluidas en el pack
  pack_horas_mes        INT,             -- clases por mes incluidas en el pack
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.precios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona precios"
  ON public.precios FOR ALL USING (public.is_admin());

-- Lectura pública para el frontend (calcular precios)
CREATE POLICY "Precios visibles para autenticados"
  ON public.precios FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── 2. Tabla packs contratados por alumnos ────────────────────
CREATE TABLE IF NOT EXISTS public.alumnos_packs (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id    UUID    NOT NULL REFERENCES public.alumnos(id)  ON DELETE CASCADE,
  profesor_id  UUID    NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  materia      TEXT    NOT NULL,
  nivel        TEXT    NOT NULL CHECK (nivel IN ('primario','secundario','terciario','taller')),
  tipo_pack    TEXT    NOT NULL CHECK (tipo_pack IN ('semanal','mensual','hora')),
  activo       BOOLEAN NOT NULL DEFAULT true,
  fecha_inicio DATE    NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin    DATE,
  notas        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alumnos_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona packs"
  ON public.alumnos_packs FOR ALL USING (public.is_admin());

CREATE POLICY "Packs visibles para staff"
  ON public.alumnos_packs FOR SELECT USING (public.is_staff());

-- ── 3. Políticas admin faltantes en tablas existentes ─────────

-- Admin puede INSERT en turnos (para turnos masivos)
CREATE POLICY "Admin inserta turnos"
  ON public.turnos FOR INSERT WITH CHECK (public.is_admin());

-- Admin puede INSERT en slots
CREATE POLICY "Admin inserta slots"
  ON public.slots FOR INSERT WITH CHECK (public.is_admin());

-- Admin puede INSERT en alumnos
CREATE POLICY "Admin inserta alumnos"
  ON public.alumnos FOR INSERT WITH CHECK (public.is_admin());

-- Admin puede UPDATE en alumnos
CREATE POLICY "Admin actualiza alumnos"
  ON public.alumnos FOR UPDATE USING (public.is_admin());

-- ── 4. Semilla de precios iniciales ──────────────────────────
INSERT INTO public.precios (nivel, valor_hora, porcentaje_profesor, pack_semanal_precio, pack_mensual_precio, pack_horas_semana, pack_horas_mes)
VALUES
  ('primario',   0, 50, 0, 0, 4, 16),
  ('secundario', 0, 50, NULL, 0, NULL, 12),
  ('terciario',  0, 50, NULL, NULL, NULL, NULL),
  ('taller',     0, 50, NULL, NULL, NULL, NULL)
ON CONFLICT (nivel) DO NOTHING;
