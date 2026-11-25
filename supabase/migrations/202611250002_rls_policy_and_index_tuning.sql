drop policy "Owners and admins can manage agency membership" on public.agency_members;

create policy "Owners and admins can add agency members"
on public.agency_members for insert to authenticated
with check (private.has_agency_role(agency_id, array['owner', 'admin']::public.agency_role[]));

create policy "Owners and admins can update agency members"
on public.agency_members for update to authenticated
using (private.has_agency_role(agency_id, array['owner', 'admin']::public.agency_role[]))
with check (private.has_agency_role(agency_id, array['owner', 'admin']::public.agency_role[]));

create policy "Owners and admins can remove agency members"
on public.agency_members for delete to authenticated
using (private.has_agency_role(agency_id, array['owner', 'admin']::public.agency_role[]));

drop policy "Agency admins can manage client portal access" on public.client_portal_members;

create policy "Agency strategists can add client portal access"
on public.client_portal_members for insert to authenticated
with check (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]));

create policy "Agency strategists can update client portal access"
on public.client_portal_members for update to authenticated
using (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]))
with check (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]));

create policy "Agency strategists can remove client portal access"
on public.client_portal_members for delete to authenticated
using (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]));

create index client_portal_members_agency_client_idx on public.client_portal_members(agency_id, client_id);
create index client_portal_members_user_idx on public.client_portal_members(user_id);
create index strategy_projects_agency_client_idx on public.strategy_projects(agency_id, client_id);
create index strategy_projects_created_by_idx on public.strategy_projects(created_by);
create index research_records_created_by_idx on public.research_records(created_by);

