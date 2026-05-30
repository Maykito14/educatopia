-- ============================================================
-- Educatopia — Fix: infinite recursion en políticas RLS
-- ============================================================
-- La política "Admin ve todos los perfiles" consultaba profiles
-- dentro de una política sobre profiles → recursión infinita.
-- Solución: función SECURITY DEFINER que omite RLS al checar el rol.
-- ============================================================

-- ── Función helper: chequea si el usuario actual es admin ─────
-- SECURITY DEFINER ejecuta como el dueño (bypasa RLS), rompiendo
-- la recursión. SET search_path evita inyección de esquema.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol IN ('admin', 'profesor')
  );
$$;

-- ── Profiles: reemplazar política recursiva ───────────────────
DROP POLICY IF EXISTS "Admin ve todos los perfiles" ON public.profiles;
CREATE POLICY "Admin ve todos los perfiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- ── Colegios: usar función en vez de subquery inline ─────────
DROP POLICY IF EXISTS "Admin gestiona colegios" ON public.colegios;
CREATE POLICY "Admin gestiona colegios"
  ON public.colegios FOR ALL
  USING (public.is_admin());

-- ── Materias: ídem ────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin gestiona materias" ON public.materias;
CREATE POLICY "Admin gestiona materias"
  ON public.materias FOR ALL
  USING (public.is_admin());

-- ── Profesores: ídem ─────────────────────────────────────────
DROP POLICY IF EXISTS "Admin gestiona profesores" ON public.profesores;
CREATE POLICY "Admin gestiona profesores"
  ON public.profesores FOR ALL
  USING (public.is_admin());

-- ── Alumnos ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin gestiona alumnos" ON public.alumnos;
CREATE POLICY "Admin gestiona alumnos"
  ON public.alumnos FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Alumno o tutor ve sus propios datos" ON public.alumnos;
CREATE POLICY "Alumno o tutor ve sus propios datos"
  ON public.alumnos FOR SELECT
  USING (
    profile_id = auth.uid() OR
    tutor_id   = auth.uid() OR
    public.is_staff()
  );

-- ── Slots ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Profesor gestiona sus propios slots" ON public.slots;
CREATE POLICY "Profesor gestiona sus propios slots"
  ON public.slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profesores
      WHERE id = slots.profesor_id AND profile_id = auth.uid()
    ) OR public.is_admin()
  );

-- ── Turnos ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin o profesor gestiona turnos" ON public.turnos;
CREATE POLICY "Admin o profesor gestiona turnos"
  ON public.turnos FOR UPDATE
  USING (public.is_staff());

DROP POLICY IF EXISTS "Alumno o tutor ve sus turnos" ON public.turnos;
CREATE POLICY "Alumno o tutor ve sus turnos"
  ON public.turnos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alumnos
      WHERE id = turnos.alumno_id
        AND (profile_id = auth.uid() OR tutor_id = auth.uid())
    ) OR public.is_staff()
  );
