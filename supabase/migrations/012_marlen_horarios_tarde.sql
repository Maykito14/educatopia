-- Agregar horarios de tarde (17-20hs Lun-Vie) y mañana extra (Mar/Jue 08-11:30) para Profemarlen

DO $$
DECLARE
  v_marlen UUID;
BEGIN
  SELECT id INTO v_marlen FROM public.profesores WHERE nombre = 'Profemarlen';

  IF v_marlen IS NULL THEN
    RAISE EXCEPTION 'No se encontró el profesor Profemarlen';
  END IF;

  -- Tarde: Lunes a Viernes 17:00 - 20:00
  INSERT INTO public.profesores_disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos, activo)
  VALUES
    (v_marlen, 1, '17:00', '20:00', 60, true),  -- Lunes tarde
    (v_marlen, 2, '17:00', '20:00', 60, true),  -- Martes tarde
    (v_marlen, 3, '17:00', '20:00', 60, true),  -- Miércoles tarde
    (v_marlen, 4, '17:00', '20:00', 60, true),  -- Jueves tarde
    (v_marlen, 5, '17:00', '20:00', 60, true);  -- Viernes tarde

  -- Mañana extra: Martes y Jueves 08:00 - 11:30
  INSERT INTO public.profesores_disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin, duracion_minutos, activo)
  VALUES
    (v_marlen, 2, '08:00', '11:30', 60, true),  -- Martes mañana
    (v_marlen, 4, '08:00', '11:30', 60, true);  -- Jueves mañana

END $$;
