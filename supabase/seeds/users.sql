-- supabase/seed.sql

-- Regular user: user@test.com / password123, Display Name: "Regular User"
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'user@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '', '', '', '',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name": "Regular User"}'::jsonb,
  NOW(), NOW()
);

-- Admin user: admin@test.com / password123, Display Name: "Admin User"
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '', '', '', '',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name": "Admin User", "role": "admin"}'::jsonb,
  NOW(), NOW()
);

-- Identities
INSERT INTO auth.identities (user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
  id, 
  jsonb_build_object('sub', id::text, 'email', email),
  'email', 
  id::text,
  NOW(), NOW(), NOW()
FROM auth.users 
WHERE email IN ('user@test.com', 'admin@test.com');
