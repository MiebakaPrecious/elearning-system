-- Avatars
CREATE POLICY "avatars read authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');
CREATE POLICY "avatars insert own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars update own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars delete own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Course content
CREATE POLICY "course content read authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'course-content');
CREATE POLICY "course content insert staff" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-content'
  AND (public.has_role(auth.uid(), 'lecturer') OR public.has_role(auth.uid(), 'admin'))
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "course content update staff" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-content' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "course content delete staff" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-content' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));