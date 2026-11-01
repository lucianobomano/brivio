-- Profile row for every new account, whatever the sign-up method.
-- Before: the insert failed (and with it the whole sign-up) when the metadata had no "name"
-- (Google sends "full_name", accounts created from the dashboard send nothing), and the account
-- type chosen on the sign-up form was dropped.
-- Now: name falls back to full_name, then to the part of the email before the @; the account type
-- is kept when it is one of the allowed values (never "admin"); a second insert for the same id is ignored;
-- search_path is pinned (SECURITY DEFINER function).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  role_text text := meta->>'role_global';
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, role_global)
  VALUES (
    new.id,
    new.email,
    coalesce(nullif(trim(meta->>'name'), ''), nullif(trim(meta->>'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1), 'Utilizador'),
    coalesce(meta->>'avatar_url', meta->>'picture'),
    CASE WHEN role_text IN ('designer', 'agency_owner', 'client') THEN role_text::public.global_role ELSE 'designer'::public.global_role END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
