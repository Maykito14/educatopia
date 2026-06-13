-- Porcentaje de liquidación por profesor (independiente del nivel educativo)
ALTER TABLE public.profesores
  ADD COLUMN IF NOT EXISTS porcentaje_liquidacion NUMERIC(5,2) NOT NULL DEFAULT 50;

-- Valores específicos por profesor
UPDATE public.profesores SET porcentaje_liquidacion = 50 WHERE lower(nombre) LIKE '%andrea%';
UPDATE public.profesores SET porcentaje_liquidacion = 60 WHERE lower(nombre) LIKE '%marlen%';
UPDATE public.profesores SET porcentaje_liquidacion = 60 WHERE lower(nombre) LIKE '%mayco%';
