-- Horas totales que cubre cada pack, necesario para:
-- precio_turno = (pack_precio / pack_horas) × turno_horas
ALTER TABLE precios
  ADD COLUMN IF NOT EXISTS pack_semanal_horas NUMERIC DEFAULT 3,
  ADD COLUMN IF NOT EXISTS pack_mensual_horas NUMERIC DEFAULT 12;

-- Actualizar valores reales (ajustar si el valor de secundario es diferente)
UPDATE precios SET pack_semanal_horas = 3  WHERE nivel = 'primario';
UPDATE precios SET pack_mensual_horas = 12 WHERE nivel = 'primario';
-- Repetir para secundario cuando se confirmen sus horas:
-- UPDATE precios SET pack_semanal_horas = X WHERE nivel = 'secundario';
-- UPDATE precios SET pack_mensual_horas = Y WHERE nivel = 'secundario';
