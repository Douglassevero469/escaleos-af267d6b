
INSERT INTO public.user_roles (user_id, role)
VALUES ('5248188a-8002-4e55-90a8-d8369d27f122', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
