import { redirect } from "next/navigation";
import { createAgency, createClientRecord, createStrategyProject, signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

type DashboardProps = { searchParams: Promise<{ agency?: string; error?: string; created?: string }> };

const phases = [
  { number: "01", name: "Discovery & Research", text: "Stakeholders, competitors, and audience understanding" },
  { number: "02", name: "Brand Strategy", text: "Positioning, values, voice, and creative direction" },
  { number: "03", name: "Visual Identity System", text: "Identity assets, typography, color, and design systems" },
  { number: "04", name: "Guidelines & Rollout", text: "Brand governance, touchpoints, and handover" },
];

function statusMessage(error?: string, created?: string) {
  if (error) return "That change could not be saved. Check the required fields and your agency permissions, then try again.";
  if (created === "agency") return "Agency workspace created. You are its owner.";
  if (created === "client") return "Client added to this agency.";
  if (created === "project") return "Strategy project created in Discovery & Research.";
  return null;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect("/login?setup=supabase");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims, error: claimError } = await supabase.auth.getClaims();
  if (claimError || !claims?.claims?.sub) redirect("/login");

  const { data: agencies, error: agencyError } = await supabase.from("agencies").select("id,name").order("name");
  if (!agencyError && !agencies?.length) {
    const { data: portalAccess } = await supabase.from("client_portal_members").select("client_id").eq("user_id", claims.claims.sub).limit(1);
    if (portalAccess?.length) redirect("/portal");
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="/dashboard">STRATEGY STUDIO</a>
        <form action={signOut}><button className="text-button" type="submit">Sign out</button></form>
      </header>
      <section className="dashboard-content">
        <p className="eyebrow">AGENCY WORKSPACE</p>
        <h1>Build brands with clarity.</h1>
        <p className="muted">A guided strategy process, from discovery through rollout. Your team makes the strategic calls; the workspace keeps the research and decisions organised.</p>
        {statusMessage(params.error, params.created) && <p className={params.error ? "error" : "notice"} role="status">{statusMessage(params.error, params.created)}</p>}

        {agencyError ? (
          <p className="error" role="alert">We could not load your agency workspaces. Refresh the page or check your account access.</p>
        ) : !agencies?.length ? (
          <section className="panel onboarding-panel">
            <p className="eyebrow">FIRST STEP</p>
            <h2>Create your agency workspace</h2>
            <p className="muted">You’ll become its owner. You can add clients and strategy projects next.</p>
            <form action={createAgency} className="form-grid compact-form">
              <label htmlFor="agency-name">Agency name</label>
              <input id="agency-name" name="name" required maxLength={120} placeholder="Your agency" />
              <button type="submit">Create workspace</button>
            </form>
          </section>
        ) : (
          <AgencyWorkspace agencies={agencies} requestedAgency={params.agency} />
        )}

        <section className="phase-overview" aria-labelledby="phases-heading">
          <div><p className="eyebrow">THE STRATEGY ENGINE</p><h2 id="phases-heading">Four connected phases</h2></div>
          <div className="phase-list">
            {phases.map((phase) => <article key={phase.number}><span>{phase.number}</span><div><h3>{phase.name}</h3><p>{phase.text}</p></div></article>)}
          </div>
        </section>
      </section>
    </main>
  );
}

async function AgencyWorkspace({ agencies, requestedAgency }: { agencies: { id: string; name: string }[]; requestedAgency?: string }) {
  const selectedAgency = agencies.find((agency) => agency.id === requestedAgency) ?? agencies[0];
  const supabase = await createClient();
  const [clientsResult, projectsResult] = await Promise.all([
    supabase.from("clients").select("id,name,industry,website").eq("agency_id", selectedAgency.id).order("name"),
    supabase.from("strategy_projects").select("id,name,client_id,current_phase,status,updated_at").eq("agency_id", selectedAgency.id).order("updated_at", { ascending: false }),
  ]);
  const clients = clientsResult.data ?? [];
  const projects = projectsResult.data ?? [];
  const clientNames = new Map(clients.map((client) => [client.id, client.name]));

  return (
    <>
      {agencies.length > 1 && <nav className="agency-switcher" aria-label="Agency workspaces">{agencies.map((agency) => <a key={agency.id} aria-current={agency.id === selectedAgency.id ? "page" : undefined} href={`/dashboard?agency=${encodeURIComponent(agency.id)}`}>{agency.name}</a>)}</nav>}
      <div className="workspace-heading"><div><p className="eyebrow">CURRENT AGENCY</p><h2>{selectedAgency.name}</h2></div></div>
      {(clientsResult.error || projectsResult.error) && <p className="error" role="alert">Some workspace data could not be loaded. Check your access and refresh.</p>}
      <div className="workspace-grid">
        <section className="panel">
          <p className="eyebrow">CLIENTS</p><h2>Add a client</h2>
          <form action={createClientRecord} className="form-grid">
            <input type="hidden" name="agency_id" value={selectedAgency.id} />
            <label htmlFor="client-name">Client name</label><input id="client-name" name="name" required maxLength={160} />
            <label htmlFor="client-industry">Industry</label><input id="client-industry" name="industry" maxLength={120} />
            <label htmlFor="client-website">Website</label><input id="client-website" name="website" type="url" placeholder="https://example.com" />
            <button type="submit">Add client</button>
          </form>
          <h3 className="list-heading">Clients in this agency <span>{clients.length}</span></h3>
          {clients.length ? <ul className="simple-list">{clients.map((client) => <li key={client.id}><strong>{client.name}</strong>{client.industry && <span>{client.industry}</span>}</li>)}</ul> : <p className="empty-state">No clients yet. Add the first client above.</p>}
        </section>

        <section className="panel">
          <p className="eyebrow">STRATEGY PROJECTS</p><h2>Start a project</h2>
          <form action={createStrategyProject} className="form-grid">
            <input type="hidden" name="agency_id" value={selectedAgency.id} />
            <label htmlFor="project-name">Project name</label><input id="project-name" name="name" required maxLength={160} />
            <label htmlFor="project-client">Client</label>
            <select id="project-client" name="client_id" required disabled={!clients.length} defaultValue="">
              <option value="" disabled>{clients.length ? "Choose a client" : "Add a client first"}</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
            <button type="submit" disabled={!clients.length}>Create project</button>
          </form>
          <h3 className="list-heading">Projects <span>{projects.length}</span></h3>
          {projects.length ? <ul className="project-list">{projects.map((project) => <li key={project.id}><div><strong>{project.name}</strong><span>{clientNames.get(project.client_id) ?? "Client project"} · {project.status.replace("_", " ")}</span></div><a href={`/dashboard/projects/${project.id}/discovery-research`}>Open research</a></li>)}</ul> : <p className="empty-state">No projects yet. Create a client project to begin discovery.</p>}
        </section>
      </div>
    </>
  );
}

