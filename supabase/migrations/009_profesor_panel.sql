-- ============================================================
-- Educatopia — Panel Profesor
-- Nuevos estados en turnos, bloqueos de disponibilidad,
-- función helper para RLS, y vinculación de auth users.
-- ============================================================

-- ── 1. Nuevos campos en turnos ───────────────────────────────
ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS confirmado_por_profesor BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS asistio                 BOOLEAN,          -- NULL = sin info
  ADD COLUMN IF NOT EXISTS pagado                  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cobrado                 BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Tabla bloqueos de disponibilidad ──────────────────────
CREATE TABLE IF NOT EXISTS public.profesores_bloqueos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  fecha       DATE NOT NULL,
  motivo      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profesor_id, fecha)
);

ALTER TABLE public.profesores_bloqueos ENABLE ROW LEVEL SECURITY;

-- ── 3. Función helper: devuelve el UUID del profesor propio ───
CREATE OR REPLACE FUNCTION public.get_my_profesor_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profesores WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- ── 4. RLS actualizado para bloqueos ─────────────────────────
CREATE POLICY "Profesor gestiona sus propios bloqueos"
  ON public.profesores_bloqueos FOR ALL
  USING (profesor_id = public.get_my_profesor_id());

CREATE POLICY "Admin gestiona todos los bloqueos"
  ON public.profesores_bloqueos FOR ALL
  USING (public.is_admin());

-- ── 5. RLS turnos — reemplazar política broad de staff ────────
DROP POLICY IF EXISTS "Admin o profesor gestiona turnos"    ON public.turnos;
DROP POLICY IF EXISTS "Alumno o tutor ve sus turnos"        ON public.turnos;

-- Profesores ven solo sus propios turnos (via slot.profesor_id)
CREATE POLICY "Profesor ve sus propios turnos"
  ON public.turnos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.slots
      WHERE id = turnos.slot_id
        AND profesor_id = public.get_my_profesor_id()
    )
  );

-- Admin ve todos
CREATE POLICY "Admin ve todos los turnos"
  ON public.turnos FOR SELECT
  USING (public.is_admin());

-- Profesor puede actualizar confirmación y asistencia en sus turnos
CREATE POLICY "Profesor actualiza sus propios turnos"
  ON public.turnos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.slots
      WHERE id = turnos.slot_id
        AND profesor_id = public.get_my_profesor_id()
    )
  );

-- Admin puede actualizar todo
CREATE POLICY "Admin actualiza todos los turnos"
  ON public.turnos FOR UPDATE
  USING (public.is_admin());

-- ── 6. RLS slots — professor ve solo los suyos ───────────────
DROP POLICY IF EXISTS "Slots visibles para todos los autenticados" ON public.slots;

CREATE POLICY "Profesor ve sus propios slots"
  ON public.slots FOR SELECT
  USING (profesor_id = public.get_my_profesor_id());

CREATE POLICY "Admin ve todos los slots"
  ON public.slots FOR SELECT
  USING (public.is_admin());

-- ── 7. RLS profesores_disponibilidad — profesor modifica la suya
CREATE POLICY "Profesor gestiona su disponibilidad"
  ON public.profesores_disponibilidad FOR UPDATE
  USING (profesor_id = public.get_my_profesor_id());

-- ── 8. RLS profesores_materias — profesor modifica las suyas ─
CREATE POLICY "Profesor gestiona sus materias"
  ON public.profesores_materias FOR ALL
  USING (profesor_id = public.get_my_profesor_id());

-- ── 9. Vincular usuarios auth a registros de profesores ──────
DO $$
DECLARE
  uid_profemarlen UUID;
  uid_senoandrea  UUID;
  uid_profemayco  UUID;
BEGIN
  SELECT id INTO uid_profemarlen FROM auth.users WHERE email = 'profemarlen@educatopia.ar';
  SELECT id INTO uid_senoandrea  FROM auth.users WHERE email = 'senoandrea@educatopia.ar';
  SELECT id INTO uid_profemayco  FROM auth.users WHERE email = 'profemayco@educatopia.ar';

  -- Crear registros de profesor para los usuarios reales (sin materias ni disponibilidad aún)
  INSERT INTO public.profesores (nombre, activo, materias, profile_id)
  VALUES
    ('Profemarlen', true, '{}', uid_profemarlen),
    ('Señoandrea',  true, '{}', uid_senoandrea),
    ('Profemayco',  true, '{}', uid_profemayco)
  ON CONFLICT DO NOTHING;
END $$;
