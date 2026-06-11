-- Horas totales que cubre cada pack, necesario para:
-- precio_turno = (pack_precio / pack_horas) × turno_horas
ALTER TABLE precios
  ADD COLUMN IF NOT EXISTS pack_semanal_horas NUMERIC DEFAULT 3,
  ADD COLUMN IF NOT EXISTS pack_mensual_horas NUMERIC DEFAULT 12;

-- Valores confirmados por nivel
UPDATE precios SET pack_semanal_horas = 3,  pack_mensual_horas = 12 WHERE nivel = 'primario';
UPDATE precios SET pack_semanal_horas = 3,  pack_mensual_horas = 12 WHERE nivel = 'secundario';
