import { notFound, redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ projectId: string }> };
const phases = ["Discovery & Research", "Brand Strategy", "Visual Identity System", "Guidelines & Rollout"];

export default async function ClientProjectPage({ params }: PageProps) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: claims, error: claimError } = await supabase.auth.getClaims();
  if (claimError || !claims?.claims?.sub) redirect("/login");

  const { data: project } = await supabase.from("strategy_projects").select("id,agency_id,client_id,name,current_phase,status").eq("id", projectId).maybeSingle();
  if (!project) notFound();
  const { data: membership } = await supabase.from("client_portal_members").select("client_id").eq("agency_id", project.agency_id).eq("client_id", project.client_id).eq("user_id", claims.claims.sub).maybeSingle();
  if (!membership) notFound();
  const [{ data: client }, { data: records }] = await Promise.all([
    supabase.from("clients").select("name").eq("id", project.client_id).maybeSingle(),
    supabase.from("research_records").select("id,record_type,title,content,created_at").eq("project_id", project.id).order("created_at", { ascending: false }),
  ]);

  return <main className="dashboard-shell">
    <header className="topbar"><a className="brand" href="/portal">CLIENT PORTAL</a><form action={signOut}><button className="text-button" type="submit">Sign out</button></form></header>
    <div className="project-layout portal-layout">
      <aside className="project-sidebar"><a className="back-link" href="/portal">← All shared projects</a><p className="eyebrow">{client?.name ?? "CLIENT PROJECT"}</p><h1>{project.name}</h1><nav className="phase-nav" aria-label="Strategy phases">{phases.map((name, index) => <span key={name} aria-current={index === 0 ? "step" : undefined}><b>{String(index + 1).padStart(2, "0")}</b>{name}</span>)}</nav></aside>
      <section className="phase-workspace"><p className="eyebrow">SHARED WITH YOU</p><h2>Project updates</h2><p className="muted">Your agency controls which research records are shared in this portal.</p>
        {records?.length ? <div className="record-list portal-records">{records.map((record) => <article className="record-card" key={record.id}><p className="eyebrow">{record.record_type.replaceAll("_", " ")}</p><h3>{record.title}</h3><dl>{Object.entries((record.content ?? {}) as Record<string, unknown>).filter(([, value]) => String(value ?? "").trim()).map(([key, value]) => <div key={key}><dt>{key.split("_").join(" ")}</dt><dd>{String(value)}</dd></div>)}</dl></article>)}</div> : <p className="empty-state">No research has been shared with you yet.</p>}
      </section>
    </div>
  </main>;
}

