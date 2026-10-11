ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('admin','staff'))
$$;
DROP POLICY IF EXISTS "staff orders read" ON public.orders;
CREATE POLICY "staff orders read" ON public.orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "staff orders update" ON public.orders;
CREATE POLICY "staff orders update" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "staff items read" ON public.order_items;
CREATE POLICY "staff items read" ON public.order_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "staff products write" ON public.products;
CREATE POLICY "staff products write" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "staff cats write" ON public.categories;
CREATE POLICY "staff cats write" ON public.categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "staff profiles read" ON public.profiles;
CREATE POLICY "staff profiles read" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));