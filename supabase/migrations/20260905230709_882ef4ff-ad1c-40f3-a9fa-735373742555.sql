-- Lecturers can create their own courses (draft / pending approval only)
CREATE POLICY "courses lecturer insert own"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'lecturer')
  AND lecturer_id = auth.uid()
  AND status IN ('draft','pending_approval')
);

-- Lecturers can delete their own drafts
CREATE POLICY "courses lecturer delete own draft"
ON public.courses FOR DELETE TO authenticated
USING (lecturer_id = auth.uid() AND status = 'draft');

-- Fix broken enrollment check on materials read policy
DROP POLICY IF EXISTS "materials read enrolled or owner" ON public.materials;
CREATE POLICY "materials read enrolled or owner"
ON public.materials FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = materials.course_id AND c.lecturer_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = materials.course_id AND e.student_id = auth.uid())
);