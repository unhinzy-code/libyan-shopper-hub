CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare p text := coalesce(new.raw_user_meta_data->>'phone', split_part(new.email,'@',1));
begin
  insert into public.profiles(id, name, phone) values (new.id, coalesce(new.raw_user_meta_data->>'name',''), p) on conflict (id) do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'user') on conflict do nothing;
  if p = '0924554163' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin'), (new.id, 'staff') on conflict do nothing;
  end if;
  return new;
end $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
INSERT INTO public.profiles(id, name, phone)
  SELECT u.id, coalesce(u.raw_user_meta_data->>'name',''), coalesce(u.raw_user_meta_data->>'phone', split_part(u.email,'@',1))
  FROM auth.users u ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_roles(user_id, role) SELECT id, 'user' FROM public.profiles
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = profiles.id AND r.role = 'user');
INSERT INTO public.user_roles(user_id, role) SELECT p.id, x.r FROM public.profiles p, (VALUES ('admin'::app_role), ('staff'::app_role)) x(r)
  WHERE p.phone = '0924554163' AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = x.r);