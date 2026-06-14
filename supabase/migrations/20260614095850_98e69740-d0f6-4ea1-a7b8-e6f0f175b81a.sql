
-- 1. Drop department FKs from profiles and courses
ALTER TABLE public.profiles DROP COLUMN IF EXISTS department_id;
ALTER TABLE public.courses  DROP COLUMN IF EXISTS department_id;

-- 2. Drop departments table (cascade any leftover refs)
DROP TABLE IF EXISTS public.departments CASCADE;

-- 3. Rewrite handle_new_user without department_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  m JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  requested_role public.app_role := COALESCE((m->>'role')::public.app_role, 'student');
  is_first BOOLEAN := NOT EXISTS(SELECT 1 FROM public.user_roles);
  final_role public.app_role := CASE WHEN is_first THEN 'admin' ELSE requested_role END;
  final_status public.approval_status := CASE WHEN is_first THEN 'approved'::public.approval_status ELSE 'pending'::public.approval_status END;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, matric_number, staff_id, level, rank_id, approval_status)
  VALUES (
    NEW.id,
    COALESCE(m->>'full_name', NEW.email),
    NEW.email,
    NULLIF(m->>'phone',''),
    NULLIF(m->>'matric_number',''),
    NULLIF(m->>'staff_id',''),
    NULLIF(m->>'level','')::public.level_type,
    NULLIF(m->>'rank_id','')::uuid,
    final_status
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, final_role);
  RETURN NEW;
END; $function$;
