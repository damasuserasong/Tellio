
-- Enforce at the DB level that owners can never read hashed tokens or thread secrets directly
REVOKE SELECT (device_token_hash) ON public.respondent_identities FROM authenticated;
REVOKE SELECT (secret_hash, recovery_code_hash) ON public.threads FROM authenticated;

-- Allow column-level select of safe columns explicitly
GRANT SELECT (id, link_id, alias, display_name, identity_mode, blocked, created_at) ON public.respondent_identities TO authenticated;
GRANT SELECT (id, link_id, type, respondent_identity_id, public_label, owner_label, state, owner_unread, pinned, last_message_at, created_at) ON public.threads TO authenticated;

-- Add age_confirmed on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_confirmed boolean NOT NULL DEFAULT false;

-- Server-only sliding-window rate limiting (stores only hashed bucket keys, never raw IPs)
CREATE TABLE public.rate_limit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rate_limit_events_bucket_created ON public.rate_limit_events (bucket_key, created_at DESC);
GRANT ALL ON public.rate_limit_events TO service_role;
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

-- Platform admin role system for moderation review
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Allow platform admins to view and update reports
CREATE POLICY "Admins view all reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add message snapshot column to reports so moderation review survives deletions
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS message_snapshot text NOT NULL DEFAULT '';
