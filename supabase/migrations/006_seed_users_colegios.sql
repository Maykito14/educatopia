-- ============================================================
-- Educatopia — Usuarios iniciales y colegios en mayúsculas
-- ============================================================

-- ── Colegios en mayúsculas ────────────────────────────────────
UPDATE public.colegios SET nombre = UPPER(nombre);

-- ── Usuarios de staff ─────────────────────────────────────────
-- Contraseña inicial para todos: Educatopia2025!
-- Emails internos: {usuario}@educatopia.ar
-- Login: escribir el usuario sin dominio, ej: "profemarlen"
-- Nota: confirmation_token/recovery_token/email_change deben ser '' (no NULL)

DO $$
DECLARE
  uid1 uuid := gen_random_uuid();
  uid2 uuid := gen_random_uuid();
  uid3 uuid := gen_random_uuid();
  uid4 uuid := gen_random_uuid();
  uid5 uuid := gen_random_uuid();
  pass text := crypt('Educatopia2025!', gen_salt('bf'));
  tok  text := '';
BEGIN

  -- profemarlen (profesor)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, role, aud, is_super_admin,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
  ) VALUES (
    uid1, '00000000-0000-0000-0000-000000000000',
    'profemarlen@educatopia.ar', pass, now(),
    '{"nombre":"Profemarlen","rol":"profesor"}',
    '{"provider":"email","providers":["email"]}',
    now(), now(), 'authenticated', 'authenticated', false,
    tok, tok, tok, tok, tok
  );
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'profemarlen@educatopia.ar', uid1,
    format('{"sub":"%s","email":"profemarlen@educatopia.ar"}', uid1)::jsonb,
    'email', now(), now(), now());

  -- senoandrea (profesor) — Señoandrea normalizado a ASCII
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, role, aud, is_super_admin,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
  ) VALUES (
    uid2, '00000000-0000-0000-0000-000000000000',
    'senoandrea@educatopia.ar', pass, now(),
    '{"nombre":"Señoandrea","rol":"profesor"}',
    '{"provider":"email","providers":["email"]}',
    now(), now(), 'authenticated', 'authenticated', false,
    tok, tok, tok, tok, tok
  );
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'senoandrea@educatopia.ar', uid2,
    format('{"sub":"%s","email":"senoandrea@educatopia.ar"}', uid2)::jsonb,
    'email', now(), now(), now());

  -- profemayco (profesor)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, role, aud, is_super_admin,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
  ) VALUES (
    uid3, '00000000-0000-0000-0000-000000000000',
    'profemayco@educatopia.ar', pass, now(),
    '{"nombre":"Profemayco","rol":"profesor"}',
    '{"provider":"email","providers":["email"]}',
    now(), now(), 'authenticated', 'authenticated', false,
    tok, tok, tok, tok, tok
  );
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'profemayco@educatopia.ar', uid3,
    format('{"sub":"%s","email":"profemayco@educatopia.ar"}', uid3)::jsonb,
    'email', now(), now(), now());

  -- flor (admin)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, role, aud, is_super_admin,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
  ) VALUES (
    uid4, '00000000-0000-0000-0000-000000000000',
    'flor@educatopia.ar', pass, now(),
    '{"nombre":"Flor","rol":"admin"}',
    '{"provider":"email","providers":["email"]}',
    now(), now(), 'authenticated', 'authenticated', false,
    tok, tok, tok, tok, tok
  );
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'flor@educatopia.ar', uid4,
    format('{"sub":"%s","email":"flor@educatopia.ar"}', uid4)::jsonb,
    'email', now(), now(), now());

  -- mayco (admin)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, role, aud, is_super_admin,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
  ) VALUES (
    uid5, '00000000-0000-0000-0000-000000000000',
    'mayco@educatopia.ar', pass, now(),
    '{"nombre":"Mayco","rol":"admin"}',
    '{"provider":"email","providers":["email"]}',
    now(), now(), 'authenticated', 'authenticated', false,
    tok, tok, tok, tok, tok
  );
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'mayco@educatopia.ar', uid5,
    format('{"sub":"%s","email":"mayco@educatopia.ar"}', uid5)::jsonb,
    'email', now(), now(), now());

END $$;
