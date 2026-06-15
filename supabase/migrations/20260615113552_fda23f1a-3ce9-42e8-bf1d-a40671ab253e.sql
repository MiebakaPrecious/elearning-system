
-- Helper for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_v2()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 1. VIDEOS
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  duration_sec INT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage videos" ON public.videos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Lecturers manage own course videos" ON public.videos FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.courses c WHERE c.id=videos.course_id AND c.lecturer_id=auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM public.courses c WHERE c.id=videos.course_id AND c.lecturer_id=auth.uid()));
CREATE POLICY "Enrolled students view videos" ON public.videos FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.enrollments e WHERE e.course_id=videos.course_id AND e.student_id=auth.uid()));
CREATE TRIGGER trg_videos_updated BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_v2();

-- 2. DISCUSSIONS
CREATE TABLE public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discussions TO authenticated;
GRANT ALL ON public.discussions TO service_role;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage discussions" ON public.discussions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Course participants read discussions" ON public.discussions FOR SELECT TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.courses c WHERE c.id=discussions.course_id AND c.lecturer_id=auth.uid())
    OR EXISTS(SELECT 1 FROM public.enrollments e WHERE e.course_id=discussions.course_id AND e.student_id=auth.uid())
  );
CREATE POLICY "Course participants create discussions" ON public.discussions FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND (
      EXISTS(SELECT 1 FROM public.courses c WHERE c.id=discussions.course_id AND c.lecturer_id=auth.uid())
      OR EXISTS(SELECT 1 FROM public.enrollments e WHERE e.course_id=discussions.course_id AND e.student_id=auth.uid())
    )
  );
CREATE POLICY "Authors update own discussions" ON public.discussions FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

CREATE TABLE public.discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discussion_replies TO authenticated;
GRANT ALL ON public.discussion_replies TO service_role;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage replies" ON public.discussion_replies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Participants read replies" ON public.discussion_replies FOR SELECT TO authenticated
  USING (EXISTS(
    SELECT 1 FROM public.discussions d
    WHERE d.id=discussion_replies.discussion_id AND (
      EXISTS(SELECT 1 FROM public.courses c WHERE c.id=d.course_id AND c.lecturer_id=auth.uid())
      OR EXISTS(SELECT 1 FROM public.enrollments e WHERE e.course_id=d.course_id AND e.student_id=auth.uid())
    )
  ));
CREATE POLICY "Participants reply" ON public.discussion_replies FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS(
    SELECT 1 FROM public.discussions d
    WHERE d.id=discussion_replies.discussion_id AND (
      EXISTS(SELECT 1 FROM public.courses c WHERE c.id=d.course_id AND c.lecturer_id=auth.uid())
      OR EXISTS(SELECT 1 FROM public.enrollments e WHERE e.course_id=d.course_id AND e.student_id=auth.uid())
    )
  ));

-- 3. MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own messages" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Mark messages as read" ON public.messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- 4. CERTIFICATES
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_no TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own certificates" ON public.certificates FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "Admins manage certificates" ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Lecturers issue for own courses" ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.courses c WHERE c.id=certificates.course_id AND c.lecturer_id=auth.uid()));

-- 5. ACHIEVEMENTS
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own achievements" ON public.achievements FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "Staff manage achievements" ON public.achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lecturer'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lecturer'));

-- 6. EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  audience TEXT NOT NULL DEFAULT 'all',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_v2();

-- 7. ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read activity" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated users log own activity" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());
