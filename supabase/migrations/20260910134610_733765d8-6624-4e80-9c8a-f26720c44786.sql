DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.semesters TO anon;
GRANT SELECT ON public.academic_sessions TO anon;
GRANT SELECT ON public.lecturer_ranks TO anon;
GRANT SELECT ON public.announcements TO anon;