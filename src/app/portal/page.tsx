import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

const phaseNames: Record<string, string> = {
  discovery_research: "Discovery & Research",
  brand_strategy: "Brand Strategy",
  identity_system: "Visual Identity System",
  activation: "Guidelines & Rollout",
};

export default async function ClientPortalPage() {
  const supabase = await createClient();
  const { data: claims, error: claimError } = await supabase.auth.getClaims();
  if (claimError || !claims?.claims?.sub) redirect("/login");

  const { data: access, error: accessError } = await supabase.from("client_portal_members").select("client_id").eq("user_id", claims.claims.sub);
  const clientIds = [...new Set((access ?? []).map((row) => row.client_id))];
  const [clientsResult, projectsResult] = clientIds.length ? await Promise.all([
    supabase.from("clients").select("id,name,industry").in("id", clientIds).order("name"),
    supabase.from("strategy_projects").select("id,name,client_id,current_phase,status,updated_at").in("client_id", clientIds).order("updated_at", { ascending: false }),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  const clientNames = new Map((clientsResult.data ?? []).map((client) => [client.id, client.name]));

  return <main className="dashboard-shell">
    <header className="topbar"><a className="brand" href="/portal">CLIENT PORTAL</a><form action={signOut}><button className="text-button" type="submit">Sign out</button></form></header>
    <section className="dashboard-content">
      <p className="eyebrow">YOUR BRAND WORK</p>
      <h1>Project updates</h1>
      <p className="muted">See the strategy work your agency has shared with you.</p>
      {(accessError || clientsResult.error || projectsResult.error) && <p className="error" role="alert">We could not load your shared projects. Contact your agency team for help.</p>}
      {!accessError && !clientIds.length && <p className="empty-state">No project access has been assigned to this account yet.</p>}
      {projectsResult.data?.length ? <div className="portal-project-grid">{projectsResult.data.map((project) => <article className="panel" key={project.id}>
        <p className="eyebrow">{clientNames.get(project.client_id) ?? "CLIENT PROJECT"}</p>
        <h2>{project.name}</h2>
        <p className="muted">Current phase: {phaseNames[project.current_phase] ?? "Discovery & Research"}</p>
        <a className="inline-link" href={`/portal/projects/${project.id}`}>View shared updates</a>
      </article>)}</div> : !accessError && !!clientIds.length && <p className="empty-state">Your agency has not shared any projects yet.</p>}
    </section>
  </main>;
}

