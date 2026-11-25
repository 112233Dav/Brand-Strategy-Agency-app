create policy "Assigned client portal members can read their client"
on public.clients for select to authenticated
using (private.is_client_portal_member(agency_id, id));

