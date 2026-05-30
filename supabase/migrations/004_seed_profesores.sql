-- ============================================================
-- Educatopia — Seed: profesores de ejemplo
-- Correr DESPUÉS de 003_colegios_materias_disponibilidad.sql
-- ============================================================

-- Insertamos los profesores directamente (sin auth.users —
-- el admin los vincula a un perfil después del registro)

INSERT INTO public.profesores (id, nombre, materias, activo) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Prof. Lucía Fernández',  ARRAY['Matemática','Física','Ciencias Naturales'], true),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Prof. Carlos Méndez',   ARRAY['Física','Química','Matemática'],             true),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Prof. Ana Ríos',         ARRAY['Inglés','Portugués'],                       true),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Prof. Marta Villalba',   ARRAY['Historia','Geografía','Lengua','Ciencias Sociales'], true),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Prof. Diego Sosa',       ARRAY['Computación','Contabilidad'],               true);

-- ── Profesores ↔ Materias ────────────────────────────────────

-- Lucía Fernández: Matemática (primario+secundario), Física (secundario), Ciencias Naturales (primario)
INSERT INTO public.profesores_materias (profesor_id, materia_id)
SELECT 'a1b2c3d4-0001-0001-0001-000000000001', id
FROM public.materias
WHERE (nombre = 'Matemática' AND nivel IN ('primario','secundario'))
   OR (nombre = 'Física'             AND nivel = 'secundario')
   OR (nombre = 'Ciencias Naturales' AND nivel = 'primario');

-- Carlos Méndez: Física, Química, Matemática (secundario+terciario)
INSERT INTO public.profesores_materias (profesor_id, materia_id)
SELECT 'a1b2c3d4-0002-0002-0002-000000000002', id
FROM public.materias
WHERE nombre IN ('Física','Química','Matemática')
  AND nivel IN ('secundario','terciario');

-- Ana Ríos: Inglés, Portugués (todos los niveles)
INSERT INTO public.profesores_materias (profesor_id, materia_id)
SELECT 'a1b2c3d4-0003-0003-0003-000000000003', id
FROM public.materias
WHERE nombre IN ('Inglés','Portugués');

-- Marta Villalba: Historia, Geografía, Lengua, Ciencias Sociales (primario+secundario)
INSERT INTO public.profesores_materias (profesor_id, materia_id)
SELECT 'a1b2c3d4-0004-0004-0004-000000000004', id
FROM public.materias
WHERE nombre IN ('Historia','Geografía','Lengua','Ciencias Sociales')
  AND nivel IN ('primario','secundario');

-- Diego Sosa: Computación, Contabilidad (secundario+terciario+taller)
INSERT INTO public.profesores_materias (profesor_id, materia_id)
SELECT 'a1b2c3d4-0005-0005-0005-000000000005', id
FROM public.materias
WHERE nombre IN ('Computación','Contabilidad')
  AND nivel IN ('secundario','terciario','taller');

-- ── Disponibilidad semanal ───────────────────────────────────
-- dia_semana: 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado

-- Lucía Fernández
INSERT INTO public.profesores_disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 1, '09:00', '12:00', 60),
  ('a1b2c3d4-0001-0001-0001-000000000001', 2, '09:00', '12:00', 60),
  ('a1b2c3d4-0001-0001-0001-000000000001', 4, '14:00', '18:00', 60);

-- Carlos Méndez
INSERT INTO public.profesores_disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos) VALUES
  ('a1b2c3d4-0002-0002-0002-000000000002', 2, '14:00', '18:00', 90),
  ('a1b2c3d4-0002-0002-0002-000000000002', 3, '09:00', '12:00', 60),
  ('a1b2c3d4-0002-0002-0002-000000000002', 5, '16:00', '20:00', 60);

-- Ana Ríos
INSERT INTO public.profesores_disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos) VALUES
  ('a1b2c3d4-0003-0003-0003-000000000003', 1, '14:00', '18:00', 60),
  ('a1b2c3d4-0003-0003-0003-000000000003', 3, '14:00', '18:00', 60),
  ('a1b2c3d4-0003-0003-0003-000000000003', 6, '09:00', '13:00', 60);

-- Marta Villalba
INSERT INTO public.profesores_disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos) VALUES
  ('a1b2c3d4-0004-0004-0004-000000000004', 1, '10:00', '13:00', 60),
  ('a1b2c3d4-0004-0004-0004-000000000004', 3, '09:00', '12:00', 60),
  ('a1b2c3d4-0004-0004-0004-000000000004', 5, '09:00', '12:00', 60);

-- Diego Sosa
INSERT INTO public.profesores_disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos) VALUES
  ('a1b2c3d4-0005-0005-0005-000000000005', 2, '17:00', '20:00', 60),
  ('a1b2c3d4-0005-0005-0005-000000000005', 4, '17:00', '20:00', 60),
  ('a1b2c3d4-0005-0005-0005-000000000005', 6, '09:00', '12:00', 60);
