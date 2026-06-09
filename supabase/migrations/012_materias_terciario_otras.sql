-- Agregar Física y Química al nivel terciario
-- (aplicado directamente via API el 2026-06-09)
INSERT INTO public.materias (nombre, nivel, orden) VALUES
  ('Física',   'terciario', 6),
  ('Química',  'terciario', 7)
ON CONFLICT DO NOTHING;
