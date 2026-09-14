-- 1. Fix broken "enrolled" predicates (e.course_id = e.course_id)
DROP POLICY IF EXISTS "assignments read enrolled or owner" ON public.assignments;
CREATE POLICY "assignments read enrolled or owner" ON public.assignments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'admin') OR
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = assignments.course_id AND c.lecturer_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = assignments.course_id AND e.student_id = auth.uid())
);

DROP POLICY IF EXISTS "att_sessions read" ON public.attendance_sessions;
CREATE POLICY "att_sessions read" ON public.attendance_sessions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'admin') OR lecturer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = attendance_sessions.course_id AND e.student_id = auth.uid())
);

-- 2. Quizzes: publish flag + fixed read
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "quizzes read enrolled or owner" ON public.quizzes;
CREATE POLICY "quizzes read enrolled or owner" ON public.quizzes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'admin') OR
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = quizzes.course_id AND c.lecturer_id = auth.uid()) OR
  (is_published AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = quizzes.course_id AND e.student_id = auth.uid()))
);

-- 3. Quiz questions: only course participants, and answer key hidden from clients
DROP POLICY IF EXISTS "quiz_questions read" ON public.quiz_questions;
CREATE POLICY "quiz_questions read" ON public.quiz_questions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id
    WHERE q.id = quiz_questions.quiz_id AND (
      has_role(auth.uid(),'admin') OR c.lecturer_id = auth.uid() OR
      (q.is_published AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = q.course_id AND e.student_id = auth.uid()))
    )
  )
);

REVOKE SELECT ON public.quiz_questions FROM authenticated;
GRANT SELECT (id, quiz_id, type, prompt, options, points, sort_order) ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;

-- 4. Lecturers cannot approve/archive their own courses
DROP POLICY IF EXISTS "courses lecturer write own" ON public.courses;
CREATE POLICY "courses lecturer write own" ON public.courses FOR UPDATE TO authenticated
USING (lecturer_id = auth.uid() AND status = ANY (ARRAY['draft'::course_status,'pending_approval'::course_status]))
WITH CHECK (lecturer_id = auth.uid() AND status = ANY (ARRAY['draft'::course_status,'pending_approval'::course_status]));

-- 5. Submissions: students own content only, lecturers/admin grade
CREATE OR REPLACE FUNCTION public.guard_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_staff boolean; due timestamptz;
BEGIN
  is_staff := has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id
    WHERE a.id = NEW.assignment_id AND c.lecturer_id = auth.uid());

  IF NOT is_staff THEN
    IF TG_OP = 'INSERT' THEN
      SELECT a.due_at INTO due FROM public.assignments a WHERE a.id = NEW.assignment_id;
      IF due IS NOT NULL AND now() > due THEN
        RAISE EXCEPTION 'The deadline for this assignment has passed.';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.enrollments e
        JOIN public.assignments a ON a.id = NEW.assignment_id
        WHERE e.course_id = a.course_id AND e.student_id = auth.uid()) THEN
        RAISE EXCEPTION 'You are not enrolled in this course.';
      END IF;
      NEW.score := NULL; NEW.feedback := NULL; NEW.graded_at := NULL;
    ELSE
      IF OLD.graded_at IS NOT NULL THEN
        RAISE EXCEPTION 'This submission has already been graded and can no longer be changed.';
      END IF;
      SELECT a.due_at INTO due FROM public.assignments a WHERE a.id = OLD.assignment_id;
      IF due IS NOT NULL AND now() > due THEN
        RAISE EXCEPTION 'The deadline for this assignment has passed.';
      END IF;
      NEW.score := OLD.score; NEW.feedback := OLD.feedback; NEW.graded_at := OLD.graded_at;
      NEW.student_id := OLD.student_id; NEW.assignment_id := OLD.assignment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.score IS DISTINCT FROM OLD.score THEN
    NEW.graded_at := now();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_submission ON public.submissions;
CREATE TRIGGER trg_guard_submission BEFORE INSERT OR UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_submission();

-- 6. Quiz attempts: students cannot set their own score
CREATE OR REPLACE FUNCTION public.guard_quiz_attempt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_staff boolean;
BEGIN
  is_staff := has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id
    WHERE q.id = NEW.quiz_id AND c.lecturer_id = auth.uid());
  IF NOT is_staff THEN
    IF TG_OP = 'INSERT' THEN
      NEW.student_id := auth.uid();
      NEW.score := NULL;
    ELSE
      NEW.score := OLD.score;
      NEW.student_id := OLD.student_id;
      NEW.quiz_id := OLD.quiz_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_quiz_attempt ON public.quiz_attempts;
CREATE TRIGGER trg_guard_quiz_attempt BEFORE INSERT OR UPDATE ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.guard_quiz_attempt();

-- Server-side objective grading
CREATE OR REPLACE FUNCTION public.grade_quiz_attempt(_attempt_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.quiz_attempts; total numeric := 0; q record; given jsonb;
BEGIN
  SELECT * INTO a FROM public.quiz_attempts WHERE id = _attempt_id;
  IF a IS NULL THEN RAISE EXCEPTION 'Attempt not found.'; END IF;
  IF a.student_id <> auth.uid() AND NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'You cannot grade another student''s attempt.';
  END IF;
  FOR q IN SELECT id, correct, points, type FROM public.quiz_questions WHERE quiz_id = a.quiz_id LOOP
    given := a.answers -> q.id::text;
    IF q.type <> 'essay' AND given IS NOT NULL AND q.correct IS NOT NULL
       AND lower(btrim(given #>> '{}')) = lower(btrim(q.correct #>> '{}')) THEN
      total := total + q.points;
    END IF;
  END LOOP;
  UPDATE public.quiz_attempts SET score = total, submitted_at = COALESCE(submitted_at, now()) WHERE id = _attempt_id;
  RETURN total;
END; $$;
GRANT EXECUTE ON FUNCTION public.grade_quiz_attempt(uuid) TO authenticated;

-- 7. Enrollment eligibility
CREATE OR REPLACE FUNCTION public.guard_enrollment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.courses; lvl public.level_type;
BEGIN
  IF has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  SELECT * INTO c FROM public.courses WHERE id = NEW.course_id;
  IF c IS NULL OR c.status <> 'approved' THEN
    RAISE EXCEPTION 'This course is not open for registration yet.';
  END IF;
  SELECT level INTO lvl FROM public.profiles WHERE id = NEW.student_id;
  IF lvl IS DISTINCT FROM c.level THEN
    RAISE EXCEPTION 'This course is not available for your level.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_enrollment ON public.enrollments;
CREATE TRIGGER trg_guard_enrollment BEFORE INSERT ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.guard_enrollment();

-- 8. Attendance must be enrolled + session live
CREATE OR REPLACE FUNCTION public.guard_attendance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.attendance_sessions;
BEGIN
  SELECT * INTO s FROM public.attendance_sessions WHERE id = NEW.session_id;
  IF s IS NULL THEN RAISE EXCEPTION 'Attendance session not found.'; END IF;
  IF s.expires_at IS NOT NULL AND now() > s.expires_at THEN
    RAISE EXCEPTION 'This attendance session has closed.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = s.course_id AND e.student_id = NEW.student_id) THEN
    RAISE EXCEPTION 'You are not enrolled in this course.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_attendance ON public.attendance_records;
CREATE TRIGGER trg_guard_attendance BEFORE INSERT ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.guard_attendance();

-- 9. Discussion moderation
DROP POLICY IF EXISTS "Authors update own replies" ON public.discussion_replies;
CREATE POLICY "Authors update own replies" ON public.discussion_replies FOR UPDATE TO authenticated
USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors or course lecturer delete replies" ON public.discussion_replies;
CREATE POLICY "Authors or course lecturer delete replies" ON public.discussion_replies FOR DELETE TO authenticated
USING (
  author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.discussions d JOIN public.courses c ON c.id = d.course_id
    WHERE d.id = discussion_replies.discussion_id AND c.lecturer_id = auth.uid())
);

DROP POLICY IF EXISTS "Authors or course lecturer delete discussions" ON public.discussions;
CREATE POLICY "Authors or course lecturer delete discussions" ON public.discussions FOR DELETE TO authenticated
USING (
  author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.courses c WHERE c.id = discussions.course_id AND c.lecturer_id = auth.uid())
);

-- 10. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'general',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own notifications" ON public.notifications;
CREATE POLICY "read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "update own notifications" ON public.notifications;
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "staff create notifications" ON public.notifications;
CREATE POLICY "staff create notifications" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lecturer') OR user_id = auth.uid());

-- Notify admins of new registrations, students of course approval
CREATE OR REPLACE FUNCTION public.notify_new_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, category, link)
  SELECT ur.user_id, 'New account awaiting approval', NEW.full_name || ' registered and is pending approval.', 'registration', '/admin/users'
  FROM public.user_roles ur WHERE ur.role = 'admin';
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_new_registration ON public.profiles;
CREATE TRIGGER trg_notify_new_registration AFTER INSERT ON public.profiles
FOR EACH ROW WHEN (NEW.approval_status = 'pending') EXECUTE FUNCTION public.notify_new_registration();

CREATE OR REPLACE FUNCTION public.notify_course_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.lecturer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, category, link)
    VALUES (NEW.lecturer_id, 'Course ' || replace(NEW.status::text,'_',' '),
            NEW.code || ' — ' || NEW.title || ' is now ' || replace(NEW.status::text,'_',' ') || '.', 'course', '/lecturer/courses');
  END IF;
  IF NEW.status = 'pending_approval' AND OLD.status <> 'pending_approval' THEN
    INSERT INTO public.notifications (user_id, title, body, category, link)
    SELECT ur.user_id, 'Course awaiting approval', NEW.code || ' — ' || NEW.title || ' needs review.', 'course', '/admin/courses'
    FROM public.user_roles ur WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_course_status ON public.courses;
CREATE TRIGGER trg_notify_course_status AFTER UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.notify_course_status();

CREATE OR REPLACE FUNCTION public.notify_new_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, category, link)
  SELECT e.student_id, 'New assignment', NEW.title, 'assignment', '/student/assignments'
  FROM public.enrollments e WHERE e.course_id = NEW.course_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_new_assignment ON public.assignments;
CREATE TRIGGER trg_notify_new_assignment AFTER INSERT ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.notify_new_assignment();

-- 11. Video progress
CREATE TABLE IF NOT EXISTS public.video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  seconds_watched integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, video_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_progress TO authenticated;
GRANT ALL ON public.video_progress TO service_role;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own video progress" ON public.video_progress;
CREATE POLICY "own video progress" ON public.video_progress FOR ALL TO authenticated
USING (student_id = auth.uid() OR has_role(auth.uid(),'admin') OR EXISTS (
  SELECT 1 FROM public.videos v JOIN public.courses c ON c.id = v.course_id
  WHERE v.id = video_progress.video_id AND c.lecturer_id = auth.uid()))
WITH CHECK (student_id = auth.uid());
DROP TRIGGER IF EXISTS trg_video_progress_updated ON public.video_progress;
CREATE TRIGGER trg_video_progress_updated BEFORE UPDATE ON public.video_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_v2();

-- 12. Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_status_level ON public.courses(status, level);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON public.courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_materials_course ON public.materials(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_course ON public.videos(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_att_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_approval ON public.profiles(approval_status);