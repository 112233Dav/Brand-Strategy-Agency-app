create type public.agency_role as enum ('owner', 'admin', 'strategist', 'researcher');
create type public.strategy_phase as enum ('discovery_research', 'brand_strategy', 'identity_system', 'activation');

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.agency_members (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.agency_role not null default 'researcher',
  created_at timestamptz not null default now(),
  primary key (agency_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  industry text not null default '',
  website text not null default '',
  created_at timestamptz not null default now(),
  unique (agency_id, id)
);

create table public.strategy_projects (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  client_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  current_phase public.strategy_phase not null default 'discovery_research',
  status text not null default 'active' check (status in ('active', 'on_hold', 'complete')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (agency_id, client_id) references public.clients(agency_id, id) on delete cascade,
  unique (agency_id, id)
);

create table public.client_portal_members (
  agency_id uuid not null,
  client_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id),
  foreign key (agency_id, client_id) references public.clients(agency_id, id) on delete cascade
);

create table public.research_records (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  project_id uuid not null,
  record_type text not null check (record_type in ('stakeholder_audit', 'competitor', 'audience_profile')),
  title text not null check (length(trim(title)) > 0),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  client_visible boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (agency_id, project_id) references public.strategy_projects(agency_id, id) on delete cascade
);

create index agency_members_user_idx on public.agency_members(user_id, agency_id);
create index clients_agency_idx on public.clients(agency_id);
create index strategy_projects_agency_idx on public.strategy_projects(agency_id);
create index research_records_project_idx on public.research_records(agency_id, project_id, record_type);

create schema if not exists private;

create function public.create_agency_with_owner(agency_name text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  new_agency_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required to create an agency.';
  end if;
  if length(trim(coalesce(agency_name, ''))) = 0 then
    raise exception 'Agency name cannot be empty.';
  end if;

  insert into public.agencies(name) values (trim(agency_name)) returning id into new_agency_id;
  insert into public.agency_members(agency_id, user_id, role)
  values (new_agency_id, current_user_id, 'owner');
  return new_agency_id;
end;
$$;

create function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger strategy_projects_set_updated_at
before update on public.strategy_projects
for each row execute function private.set_updated_at();

create trigger research_records_set_updated_at
before update on public.research_records
for each row execute function private.set_updated_at();

revoke all on function public.create_agency_with_owner(text) from public, anon;
grant execute on function public.create_agency_with_owner(text) to authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;

create function private.is_client_portal_member(target_agency uuid, target_client uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.client_portal_members m where m.agency_id = target_agency and m.client_id = target_client and m.user_id = (select auth.uid()));
$$;

create function private.is_agency_member(target_agency uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.agency_members m where m.agency_id = target_agency and m.user_id = (select auth.uid()));
$$;

create function private.has_agency_role(target_agency uuid, allowed_roles public.agency_role[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.agency_members m where m.agency_id = target_agency and m.user_id = (select auth.uid()) and m.role = any(allowed_roles));
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_agency_member(uuid) from public;
revoke all on function private.has_agency_role(uuid, public.agency_role[]) from public;
revoke all on function private.is_client_portal_member(uuid, uuid) from public;
grant execute on function private.is_agency_member(uuid) to authenticated;
grant execute on function private.has_agency_role(uuid, public.agency_role[]) to authenticated;
grant execute on function private.is_client_portal_member(uuid, uuid) to authenticated;

alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;
alter table public.client_portal_members enable row level security;
alter table public.clients enable row level security;
alter table public.strategy_projects enable row level security;
alter table public.research_records enable row level security;

create policy "Agency members can read their agency" on public.agencies for select to authenticated using (private.is_agency_member(id));
create policy "Agency owners and admins can update agency" on public.agencies for update to authenticated using (private.has_agency_role(id, array['owner', 'admin']::public.agency_role[])) with check (private.has_agency_role(id, array['owner', 'admin']::public.agency_role[]));
create policy "Members can read agency membership" on public.agency_members for select to authenticated using (private.is_agency_member(agency_id));
create policy "Owners and admins can manage agency membership" on public.agency_members for all to authenticated using (private.has_agency_role(agency_id, array['owner', 'admin']::public.agency_role[])) with check (private.has_agency_role(agency_id, array['owner', 'admin']::public.agency_role[]));

create policy "Client portal members can read their own access" on public.client_portal_members for select to authenticated using (user_id = (select auth.uid()) or private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]));
create policy "Agency admins can manage client portal access" on public.client_portal_members for all to authenticated using (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[])) with check (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]));

create policy "Agency members can read clients" on public.clients for select to authenticated using (private.is_agency_member(agency_id));
create policy "Agency team can create clients" on public.clients for insert to authenticated with check (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]));
create policy "Agency team can update clients" on public.clients for update to authenticated using (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[])) with check (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]));
create policy "Agency admins can delete clients" on public.clients for delete to authenticated using (private.has_agency_role(agency_id, array['owner', 'admin']::public.agency_role[]));

create policy "Agency members and assigned clients can read strategy projects" on public.strategy_projects for select to authenticated using (private.is_agency_member(agency_id) or private.is_client_portal_member(agency_id, client_id));
create policy "Agency team can create strategy projects" on public.strategy_projects for insert to authenticated with check (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]));
create policy "Agency team can update strategy projects" on public.strategy_projects for update to authenticated using (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[])) with check (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist']::public.agency_role[]));
create policy "Agency admins can delete strategy projects" on public.strategy_projects for delete to authenticated using (private.has_agency_role(agency_id, array['owner', 'admin']::public.agency_role[]));

create policy "Agency members and clients can read shared research records" on public.research_records for select to authenticated using (private.is_agency_member(agency_id) or (client_visible and exists (select 1 from public.strategy_projects p where p.agency_id = research_records.agency_id and p.id = research_records.project_id and private.is_client_portal_member(p.agency_id, p.client_id))));
create policy "Agency team can create research records" on public.research_records for insert to authenticated with check (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist', 'researcher']::public.agency_role[]));
create policy "Agency team can update research records" on public.research_records for update to authenticated using (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist', 'researcher']::public.agency_role[])) with check (private.has_agency_role(agency_id, array['owner', 'admin', 'strategist', 'researcher']::public.agency_role[]));
create policy "Agency admins can delete research records" on public.research_records for delete to authenticated using (private.has_agency_role(agency_id, array['owner', 'admin']::public.agency_role[]));

revoke all on public.agencies, public.agency_members, public.client_portal_members, public.clients, public.strategy_projects, public.research_records from anon, public;
grant select, insert, update, delete on public.agencies, public.agency_members, public.client_portal_members, public.clients, public.strategy_projects, public.research_records to authenticated;

