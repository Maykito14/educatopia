-- ============================================================
-- Educatopia — Horarios reales, materias actualizadas,
--              bloqueos con hora (no solo día completo)
-- ============================================================

-- ── 1. Bloqueos: agregar hora_inicio y hora_fin ───────────────
ALTER TABLE public.profesores_bloqueos
  DROP CONSTRAINT IF EXISTS profesores_bloqueos_profesor_id_fecha_key,
  ADD COLUMN IF NOT EXISTS hora_inicio TIME,
  ADD COLUMN IF NOT EXISTS hora_fin    TIME;

-- Nueva constraint: el mismo profesor no puede tener dos bloques
-- en el mismo día con el mismo inicio (NULL = todo el día).
ALTER TABLE public.profesores_bloqueos
  ADD CONSTRAINT profesores_bloqueos_unique
  UNIQUE (profesor_id, fecha, hora_inicio);

-- ── 2. Nuevas materias ────────────────────────────────────────
INSERT INTO public.materias (nombre, nivel, activo, orden) VALUES
  ('Tareas Varias', 'primario',   true, 99),
  ('TIC',           'secundario', true, 20),
  ('Informática',   'secundario', true, 21),
  ('Programación',  'secundario', true, 22),
  ('Tecnología',    'secundario', true, 23),
  ('Informática',   'terciario',  true, 20),
  ('Programación',  'terciario',  true, 21),
  ('Otras',         'terciario',  true, 99),
  ('Otras',         'secundario', true, 99)
ON CONFLICT (nombre, nivel) DO NOTHING;

-- ── 3. Desactivar materias removidas ─────────────────────────
UPDATE public.materias SET activo = false
  WHERE nombre = 'Computación' AND nivel = 'secundario';

UPDATE public.materias SET activo = false
  WHERE nombre = 'Portugués' AND nivel IN ('secundario', 'terciario');

-- ── 4. Horarios y materias por profesor ──────────────────────
DO $$
DECLARE
  v_mayco  UUID;
  v_marlen UUID;
  v_andrea UUID;
BEGIN
  SELECT id INTO v_mayco  FROM public.profesores WHERE nombre = 'Profemayco';
  SELECT id INTO v_marlen FROM public.profesores WHERE nombre = 'Profemarlen';
  SELECT id INTO v_andrea FROM public.profesores WHERE nombre = 'Señoandrea';

  IF v_mayco IS NULL OR v_marlen IS NULL OR v_andrea IS NULL THEN
    RAISE EXCEPTION 'No se encontraron los profesores reales. Verificá que existan.';
  END IF;

  -- ── Disponibilidad ──────────────────────────────────────────

  -- Profemayco: Lun/Jue/Vie 16-20, Mar/Mié 17-20
  INSERT INTO public.profesores_disponibilidad
    (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos, activo)
  VALUES
    (v_mayco, 1, '16:00', '20:00', 60, true),   -- Lunes
    (v_mayco, 2, '17:00', '20:00', 60, true),   -- Martes
    (v_mayco, 3, '17:00', '20:00', 60, true),   -- Miércoles
    (v_mayco, 4, '16:00', '20:00', 60, true),   -- Jueves
    (v_mayco, 5, '16:00', '20:00', 60, true);   -- Viernes

  -- Profemarlen: Lun/Mié/Vie 08-10:30
  INSERT INTO public.profesores_disponibilidad
    (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos, activo)
  VALUES
    (v_marlen, 1, '08:00', '10:30', 60, true),  -- Lunes
    (v_marlen, 3, '08:00', '10:30', 60, true),  -- Miércoles
    (v_marlen, 5, '08:00', '10:30', 60, true);  -- Viernes

  -- Señoandrea: dos franjas en varios días
  INSERT INTO public.profesores_disponibilidad
    (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos, activo)
  VALUES
    -- Lunes
    (v_andrea, 1, '08:30', '11:00', 60, true),
    (v_andrea, 1, '15:00', '20:30', 60, true),
    -- Martes
    (v_andrea, 2, '09:30', '12:00', 60, true),
    (v_andrea, 2, '15:00', '20:00', 60, true),
    -- Miércoles
    (v_andrea, 3, '08:30', '11:00', 60, true),
    (v_andrea, 3, '15:00', '20:30', 60, true),
    -- Jueves
    (v_andrea, 4, '09:30', '12:00', 60, true),
    (v_andrea, 4, '17:00', '20:00', 60, true),
    -- Viernes
    (v_andrea, 5, '08:30', '11:00', 60, true),
    (v_andrea, 5, '15:00', '20:30', 60, true);

  -- ── Materias ────────────────────────────────────────────────

  -- Señoandrea: todas las de primario
  DELETE FROM public.profesores_materias WHERE profesor_id = v_andrea;
  INSERT INTO public.profesores_materias (profesor_id, materia_id)
  SELECT v_andrea, id FROM public.materias
  WHERE nivel = 'primario' AND activo = true;

  -- Profemayco: secundario (TIC, Informática, Programación, Tecnología)
  --            terciario  (Informática, Programación, Contabilidad, Otras)
  DELETE FROM public.profesores_materias WHERE profesor_id = v_mayco;
  INSERT INTO public.profesores_materias (profesor_id, materia_id)
  SELECT v_mayco, id FROM public.materias
  WHERE (nivel = 'secundario' AND nombre IN ('TIC','Informática','Programación','Tecnología'))
     OR (nivel = 'terciario'  AND nombre IN ('Informática','Programación','Contabilidad','Otras'));

  -- Profemarlen: secundario (Biología, Contabilidad, Física, Química, Geografía,
  --                          Historia, Inglés, Lengua, Matemática)
  --             terciario  (Inglés, Matemática, Otras)
  DELETE FROM public.profesores_materias WHERE profesor_id = v_marlen;
  INSERT INTO public.profesores_materias (profesor_id, materia_id)
  SELECT v_marlen, id FROM public.materias
  WHERE (nivel = 'secundario' AND nombre IN (
            'Biología','Contabilidad','Física','Química',
            'Geografía','Historia','Inglés','Lengua','Matemática'))
     OR (nivel = 'terciario'  AND nombre IN ('Inglés','Matemática','Otras'));

  -- Actualizar campo legacy materias[] en profesores
  UPDATE public.profesores SET materias = (
    SELECT ARRAY(SELECT DISTINCT m.nombre FROM public.profesores_materias pm
                 JOIN public.materias m ON m.id = pm.materia_id
                 WHERE pm.profesor_id = v_andrea)
  ) WHERE id = v_andrea;

  UPDATE public.profesores SET materias = (
    SELECT ARRAY(SELECT DISTINCT m.nombre FROM public.profesores_materias pm
                 JOIN public.materias m ON m.id = pm.materia_id
                 WHERE pm.profesor_id = v_mayco)
  ) WHERE id = v_mayco;

  UPDATE public.profesores SET materias = (
    SELECT ARRAY(SELECT DISTINCT m.nombre FROM public.profesores_materias pm
                 JOIN public.materias m ON m.id = pm.materia_id
                 WHERE pm.profesor_id = v_marlen)
  ) WHERE id = v_marlen;

END $$;
