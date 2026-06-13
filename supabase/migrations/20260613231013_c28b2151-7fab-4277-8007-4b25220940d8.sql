
-- ============== ENUMS ==============
CREATE TYPE public.app_role AS ENUM ('admin','lecturer','student');
CREATE TYPE public.level_type AS ENUM ('ND1','ND2','HND1','HND2');
CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.course_status AS ENUM ('draft','pending_approval','approved','archived');
CREATE TYPE public.question_type AS ENUM ('mcq','true_false','fill_blank','essay');

-- ============== HELPER: updated_at ==============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============== USER ROLES (canonical, RLS-safe) ==============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============== DEPARTMENTS ==============
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments public read" ON public.departments FOR SELECT USING (true);
CREATE POLICY "departments admin write" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== LECTURER RANKS ==============
CREATE TABLE public.lecturer_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lecturer_ranks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lecturer_ranks TO authenticated;
GRANT ALL ON public.lecturer_ranks TO service_role;
ALTER TABLE public.lecturer_ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranks public read" ON public.lecturer_ranks FOR SELECT USING (true);
CREATE POLICY "ranks admin write" ON public.lecturer_ranks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============== ACADEMIC SESSIONS ==============
CREATE TABLE public.academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academic_sessions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academic_sessions TO authenticated;
GRANT ALL ON public.academic_sessions TO service_role;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions public read" ON public.academic_sessions FOR SELECT USING (true);
CREATE POLICY "sessions admin write" ON public.academic_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- enforce single active session
CREATE OR REPLACE FUNCTION public.enforce_single_active_session() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.academic_sessions SET is_active=false WHERE id <> NEW.id AND is_active=true;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_single_active_session AFTER INSERT OR UPDATE ON public.academic_sessions
  FOR EACH ROW WHEN (NEW.is_active = true) EXECUTE FUNCTION public.enforce_single_active_session();

-- ============== SEMESTERS ==============
CREATE TABLE public.semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, name)
);
GRANT SELECT ON public.semesters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.semesters TO authenticated;
GRANT ALL ON public.semesters TO service_role;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "semesters public read" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "semesters admin write" ON public.semesters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  matric_number TEXT UNIQUE,
  staff_id TEXT UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  level public.level_type,
  rank_id UUID REFERENCES public.lecturer_ranks(id) ON DELETE SET NULL,
  approval_status public.approval_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read self or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lecturer'));
CREATE POLICY "profiles update self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== SIGNUP TRIGGER ==============
-- Reads raw_user_meta_data to create profile + assign role. First user becomes admin (approved).
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  requested_role public.app_role := COALESCE((m->>'role')::public.app_role, 'student');
  is_first BOOLEAN := NOT EXISTS(SELECT 1 FROM public.user_roles);
  final_role public.app_role := CASE WHEN is_first THEN 'admin' ELSE requested_role END;
  final_status public.approval_status := CASE WHEN is_first THEN 'approved'::public.approval_status ELSE 'pending'::public.approval_status END;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, matric_number, staff_id, department_id, level, rank_id, approval_status)
  VALUES (
    NEW.id,
    COALESCE(m->>'full_name', NEW.email),
    NEW.email,
    NULLIF(m->>'phone',''),
    NULLIF(m->>'matric_number',''),
    NULLIF(m->>'staff_id',''),
    NULLIF(m->>'department_id','')::uuid,
    NULLIF(m->>'level','')::public.level_type,
    NULLIF(m->>'rank_id','')::uuid,
    final_status
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, final_role);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== IDENTIFIER LOOKUP (for matric/staff-id login) ==============
CREATE OR REPLACE FUNCTION public.lookup_email_by_identifier(_identifier TEXT)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email FROM public.profiles
  WHERE matric_number = _identifier OR staff_id = _identifier OR email = _identifier
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_email_by_identifier(TEXT) TO anon, authenticated;

-- ============== COURSES ==============
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  level public.level_type NOT NULL,
  semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  lecturer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  status public.course_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses public read approved" ON public.courses FOR SELECT USING (status='approved');
CREATE POLICY "courses lecturer read own" ON public.courses FOR SELECT TO authenticated USING (lecturer_id=auth.uid());
CREATE POLICY "courses admin read all" ON public.courses FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "courses lecturer write own" ON public.courses FOR UPDATE TO authenticated
  USING (lecturer_id=auth.uid() AND status IN ('draft','pending_approval'))
  WITH CHECK (lecturer_id=auth.uid());
CREATE POLICY "courses admin write" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== ENROLLMENTS ==============
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);
GRANT SELECT, INSERT, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments student self" ON public.enrollments FOR ALL TO authenticated
  USING (student_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid()))
  WITH CHECK (student_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============== MATERIALS ==============
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials read enrolled or owner" ON public.materials FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid())
    OR EXISTS(SELECT 1 FROM public.enrollments e WHERE e.course_id=course_id AND e.student_id=auth.uid())
  );
CREATE POLICY "materials write lecturer or admin" ON public.materials FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid())
  );

-- ============== ASSIGNMENTS ==============
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  max_score NUMERIC NOT NULL DEFAULT 100,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments read enrolled or owner" ON public.assignments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid())
    OR EXISTS(SELECT 1 FROM public.enrollments e WHERE e.course_id=course_id AND e.student_id=auth.uid())
  );
CREATE POLICY "assignments write lecturer or admin" ON public.assignments FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid())
  );

-- ============== SUBMISSIONS ==============
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  score NUMERIC,
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions student self" ON public.submissions FOR ALL TO authenticated
  USING (
    student_id=auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id=a.course_id WHERE a.id=assignment_id AND c.lecturer_id=auth.uid())
  )
  WITH CHECK (
    student_id=auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id=a.course_id WHERE a.id=assignment_id AND c.lecturer_id=auth.uid())
  );

-- ============== QUIZZES ==============
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_min INT,
  max_attempts INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type public.question_type NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB,
  correct JSONB,
  points NUMERIC NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB,
  score NUMERIC,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes, public.quiz_questions, public.quiz_attempts TO authenticated;
GRANT ALL ON public.quizzes, public.quiz_questions, public.quiz_attempts TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes read enrolled or owner" ON public.quizzes FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid())
    OR EXISTS(SELECT 1 FROM public.enrollments e WHERE e.course_id=course_id AND e.student_id=auth.uid())
  );
CREATE POLICY "quizzes write lecturer/admin" ON public.quizzes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.lecturer_id=auth.uid()));
CREATE POLICY "quiz_questions read" ON public.quiz_questions FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.quizzes q WHERE q.id=quiz_id));
CREATE POLICY "quiz_questions write" ON public.quiz_questions FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id=q.course_id WHERE q.id=quiz_id AND (c.lecturer_id=auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS(SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id=q.course_id WHERE q.id=quiz_id AND (c.lecturer_id=auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "quiz_attempts self or owner" ON public.quiz_attempts FOR ALL TO authenticated
  USING (student_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id=q.course_id WHERE q.id=quiz_id AND c.lecturer_id=auth.uid()))
  WITH CHECK (student_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============== ATTENDANCE ==============
CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions, public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_sessions, public.attendance_records TO service_role;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_sessions read" ON public.attendance_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR lecturer_id=auth.uid()
    OR EXISTS(SELECT 1 FROM public.enrollments e WHERE e.course_id=course_id AND e.student_id=auth.uid()));
CREATE POLICY "att_sessions write" ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR lecturer_id=auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR lecturer_id=auth.uid());
CREATE POLICY "att_records read" ON public.attendance_records FOR SELECT TO authenticated
  USING (student_id=auth.uid() OR public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.attendance_sessions s WHERE s.id=session_id AND s.lecturer_id=auth.uid()));
CREATE POLICY "att_records insert self" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (student_id=auth.uid());

-- ============== ANNOUNCEMENTS ==============
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements read" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "announcements write lecturer/admin" ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR author_id=auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR author_id=auth.uid());

-- ============== SEED DATA ==============
INSERT INTO public.departments(name, code, description) VALUES
  ('Computer Science','CSC','Software, algorithms, systems and data'),
  ('Accountancy','ACC','Financial accounting and audit'),
  ('Business Administration','BAM','Management and enterprise'),
  ('Statistics','STA','Applied statistics and analytics'),
  ('Science Laboratory Technology','SLT','Practical laboratory science');

INSERT INTO public.lecturer_ranks(name, sort_order) VALUES
  ('Assistant Lecturer',1),('Lecturer III',2),('Lecturer II',3),('Lecturer I',4),
  ('Senior Lecturer',5),('Principal Lecturer',6),('Chief Lecturer',7);

INSERT INTO public.academic_sessions(name, is_active) VALUES ('2025/2026', true);
INSERT INTO public.semesters(session_id, name)
  SELECT id, 'First Semester' FROM public.academic_sessions WHERE name='2025/2026'
  UNION ALL
  SELECT id, 'Second Semester' FROM public.academic_sessions WHERE name='2025/2026';
