DROP POLICY "public read cities" ON public.cities;
CREATE POLICY "auth read cities" ON public.cities FOR SELECT TO authenticated USING (true);