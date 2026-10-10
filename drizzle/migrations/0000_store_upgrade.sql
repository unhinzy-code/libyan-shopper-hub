ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS delivery_days text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating numeric NOT NULL DEFAULT round((3.9 + random()*1.1)::numeric, 1);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance numeric NOT NULL DEFAULT 0;

CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favs" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read notifs" ON public.notifications FOR SELECT TO anon, authenticated USING (user_id IS NULL OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "mark own read" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin write notifs" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, DELETE ON public.notifications TO authenticated;

CREATE POLICY "admin update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.notify_order_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lbl text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    lbl := CASE NEW.status::text WHEN 'confirmed' THEN 'تم تأكيد طلبك' WHEN 'processing' THEN 'طلبك قيد التجهيز' WHEN 'shipped' THEN 'تم شحن طلبك' WHEN 'delivered' THEN 'تم توصيل طلبك' WHEN 'cancelled' THEN 'تم إلغاء طلبك' ELSE 'تحديث على طلبك' END;
    INSERT INTO public.notifications(user_id, title, body, link) VALUES (NEW.user_id, lbl, 'طلب رقم #' || NEW.order_number, '/order/' || NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_order_status AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_order_status();