-- ============================================================
-- Educatopia — Reglas de negocio (triggers)
-- ============================================================

-- ============================================================
-- TRIGGER 1: Capacidad máxima del slot (máx. 4 alumnos activos)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_slot_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_capacidad INT;
  v_ocupados  INT;
BEGIN
  SELECT capacidad_max INTO v_capacidad
  FROM public.slots WHERE id = NEW.slot_id;

  SELECT COUNT(*) INTO v_ocupados
  FROM public.turnos
  WHERE slot_id = NEW.slot_id
    AND estado NOT IN ('cancelado')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF v_ocupados >= v_capacidad THEN
    RAISE EXCEPTION 'El slot ya alcanzó su capacidad máxima de % alumnos.', v_capacidad;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_capacity
  BEFORE INSERT OR UPDATE ON public.turnos
  FOR EACH ROW
  WHEN (NEW.estado NOT IN ('cancelado'))
  EXECUTE FUNCTION public.check_slot_capacity();


-- ============================================================
-- TRIGGER 2: Sin solapamiento de turnos para el mismo alumno
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_turno_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.turnos t
    JOIN public.slots s  ON s.id = t.slot_id
    JOIN public.slots ns ON ns.id = NEW.slot_id
    WHERE t.alumno_id = NEW.alumno_id
      AND t.id        != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND t.estado    NOT IN ('cancelado')
      AND s.fecha      = ns.fecha
      AND s.hora_inicio < ns.hora_fin
      AND s.hora_fin   > ns.hora_inicio
  ) THEN
    RAISE EXCEPTION 'El alumno ya tiene un turno que se superpone en ese horario.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_overlap
  BEFORE INSERT OR UPDATE ON public.turnos
  FOR EACH ROW
  WHEN (NEW.estado NOT IN ('cancelado'))
  EXECUTE FUNCTION public.check_turno_overlap();


-- ============================================================
-- TRIGGER 3: Sincronizar estado del slot (disponible / lleno)
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_slot_estado()
RETURNS TRIGGER AS $$
DECLARE
  v_slot_id     UUID;
  v_capacidad   INT;
  v_ocupados    INT;
  v_nuevo_estado TEXT;
BEGIN
  v_slot_id := COALESCE(NEW.slot_id, OLD.slot_id);

  SELECT capacidad_max INTO v_capacidad
  FROM public.slots WHERE id = v_slot_id;

  SELECT COUNT(*) INTO v_ocupados
  FROM public.turnos
  WHERE slot_id = v_slot_id AND estado NOT IN ('cancelado');

  -- No tocar slots cancelados
  IF EXISTS (SELECT 1 FROM public.slots WHERE id = v_slot_id AND estado = 'cancelado') THEN
    RETURN NULL;
  END IF;

  v_nuevo_estado := CASE WHEN v_ocupados >= v_capacidad THEN 'lleno' ELSE 'disponible' END;

  UPDATE public.slots SET estado = v_nuevo_estado WHERE id = v_slot_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_slot_estado
  AFTER INSERT OR UPDATE OR DELETE ON public.turnos
  FOR EACH ROW EXECUTE FUNCTION public.sync_slot_estado();
