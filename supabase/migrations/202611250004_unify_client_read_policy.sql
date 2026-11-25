drop policy "Agency members can read clients" on public.clients;
drop policy "Assigned client portal members can read their client" on public.clients;

create policy "Agency and assigned client portal members can read clients"
on public.clients for select to authenticated
using (private.is_agency_member(agency_id) or private.is_client_portal_member(agency_id, id));

