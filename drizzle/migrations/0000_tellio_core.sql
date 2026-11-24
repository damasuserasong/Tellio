
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text UNIQUE,
  display_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), ''),
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  slug text NOT NULL,
  title text NOT NULL DEFAULT 'Send me a message',
  prompt text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'private_threads' CHECK (type IN ('private_threads','group_feed')),
  allowed_identities text[] NOT NULL DEFAULT ARRAY['anonymous','pseudonym','named'],
  access text NOT NULL DEFAULT 'open' CHECK (access IN ('open','approval_first','named_only')),
  feed_visibility text NOT NULL DEFAULT 'owner_only' CHECK (feed_visibility IN ('owner_only','curated')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  keyword_filters text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.links TO authenticated;
GRANT ALL ON public.links TO service_role;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages links" ON public.links FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.owns_link(_link_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.links WHERE id = _link_id AND owner_id = auth.uid())
$$;

CREATE TABLE public.respondent_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  device_token_hash text NOT NULL,
  alias text NOT NULL,
  display_name text,
  identity_mode text NOT NULL DEFAULT 'anonymous' CHECK (identity_mode IN ('anonymous','pseudonym','named')),
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (link_id, device_token_hash)
);
GRANT SELECT, UPDATE ON public.respondent_identities TO authenticated;
GRANT ALL ON public.respondent_identities TO service_role;
ALTER TABLE public.respondent_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner views identities" ON public.respondent_identities FOR SELECT TO authenticated USING (public.owns_link(link_id));
CREATE POLICY "Owner blocks identities" ON public.respondent_identities FOR UPDATE TO authenticated USING (public.owns_link(link_id)) WITH CHECK (public.owns_link(link_id));

CREATE TABLE public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'private' CHECK (type IN ('private','feed')),
  respondent_identity_id uuid REFERENCES public.respondent_identities(id) ON DELETE SET NULL,
  public_label text NOT NULL DEFAULT '',
  owner_label text,
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('pending','open','closed','blocked')),
  secret_hash text UNIQUE,
  recovery_code_hash text UNIQUE,
  owner_unread integer NOT NULL DEFAULT 0,
  pinned boolean NOT NULL DEFAULT false,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX threads_link_last ON public.threads (link_id, last_message_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT ALL ON public.threads TO service_role;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner views threads" ON public.threads FOR SELECT TO authenticated USING (public.owns_link(link_id));
CREATE POLICY "Owner updates threads" ON public.threads FOR UPDATE TO authenticated USING (public.owns_link(link_id)) WITH CHECK (public.owns_link(link_id));
CREATE POLICY "Owner deletes threads" ON public.threads FOR DELETE TO authenticated USING (public.owns_link(link_id));

CREATE OR REPLACE FUNCTION public.owns_thread(_thread_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.threads t JOIN public.links l ON l.id = t.link_id WHERE t.id = _thread_id AND l.owner_id = auth.uid())
$$;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('respondent','owner')),
  identity_id uuid REFERENCES public.respondent_identities(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  state text NOT NULL DEFAULT 'visible' CHECK (state IN ('visible','pending_review','hidden','published')),
  pinned boolean NOT NULL DEFAULT false,
  answered boolean NOT NULL DEFAULT false,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_thread_created ON public.messages (thread_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner views messages" ON public.messages FOR SELECT TO authenticated USING (public.owns_thread(thread_id));
CREATE POLICY "Owner replies" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_type = 'owner' AND identity_id IS NULL AND public.owns_thread(thread_id));
CREATE POLICY "Owner moderates messages" ON public.messages FOR UPDATE TO authenticated USING (public.owns_thread(thread_id)) WITH CHECK (public.owns_thread(thread_id));

CREATE OR REPLACE FUNCTION public.bump_thread()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.threads SET last_message_at = NEW.created_at,
    owner_unread = owner_unread + CASE WHEN NEW.sender_type = 'respondent' THEN 1 ELSE 0 END
  WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_bump_thread AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.bump_thread();

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner files reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Owner views own reports" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.threads;
