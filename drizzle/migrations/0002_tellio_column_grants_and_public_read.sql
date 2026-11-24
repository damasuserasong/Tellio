
-- Revoke full table SELECT first so column-level grants actually restrict sensitive columns
REVOKE SELECT ON public.respondent_identities FROM authenticated;
GRANT SELECT (id, link_id, alias, display_name, identity_mode, blocked, created_at) ON public.respondent_identities TO authenticated;

REVOKE SELECT ON public.threads FROM authenticated;
GRANT SELECT (id, link_id, type, respondent_identity_id, public_label, owner_label, state, owner_unread, pinned, last_message_at, created_at) ON public.threads TO authenticated;

-- Allow anon to read public link metadata only (excluding keyword_filters)
GRANT SELECT (id, owner_id, slug, title, prompt, type, allowed_identities, access, feed_visibility, status, created_at) ON public.links TO anon;
CREATE POLICY "Public reads links" ON public.links FOR SELECT TO anon USING (true);

-- Allow anon to read owner-curated published messages in group feeds
GRANT SELECT (id, thread_id, sender_type, identity_id, body, reply_to_id, state, pinned, answered, created_at) ON public.messages TO anon;
CREATE POLICY "Public reads published messages" ON public.messages FOR SELECT TO anon USING (state = 'published');

-- Allow anon to read thread type/id for published feeds (no hashes or owner_label)
GRANT SELECT (id, link_id, type, state, created_at) ON public.threads TO anon;
CREATE POLICY "Public reads feed threads" ON public.threads FOR SELECT TO anon USING (type = 'feed');

-- Allow anon to read public alias/display_name for published feed attribution (never device_token_hash)
GRANT SELECT (id, link_id, alias, display_name, identity_mode) ON public.respondent_identities TO anon;
CREATE POLICY "Public reads published identities" ON public.respondent_identities FOR SELECT TO anon USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.identity_id = respondent_identities.id AND m.state = 'published'
  )
);
