-- ============================================================
-- Educatopia — Políticas de lectura pública
-- Colegios, materias y profesores son datos no sensibles
-- que deben ser visibles sin autenticación para el formulario.
-- ============================================================

-- Colegios: reemplazar política existente por lectura pública
DROP POLICY IF EXISTS "Colegios visibles para todos los autenticados" ON public.colegios;
CREATE POLICY "Colegios visibles públicamente"
  ON public.colegios FOR SELECT
  USING (activo = true);

-- Materias: reemplazar política existente por lectura pública
DROP POLICY IF EXISTS "Materias visibles para todos los autenticados" ON public.materias;
CREATE POLICY "Materias visibles públicamente"
  ON public.materias FOR SELECT
  USING (activo = true);

-- Profesores: reemplazar política existente por lectura pública
DROP POLICY IF EXISTS "Profesores visibles para todos los autenticados" ON public.profesores;
CREATE POLICY "Profesores visibles públicamente"
  ON public.profesores FOR SELECT
  USING (activo = true);

-- Profesores materias y disponibilidad: lectura pública
DROP POLICY IF EXISTS "Visible para autenticados" ON public.profesores_materias;
CREATE POLICY "Visible públicamente"
  ON public.profesores_materias FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Visible para autenticados" ON public.profesores_disponibilidad;
CREATE POLICY "Visible públicamente"
  ON public.profesores_disponibilidad FOR SELECT
  USING (activo = true);
