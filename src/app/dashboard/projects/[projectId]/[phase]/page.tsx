import { notFound, redirect } from "next/navigation";
import { createResearchRecord, signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ projectId: string; phase: string }>; searchParams: Promise<{ error?: string; saved?: string }> };
type ResearchGroup = { type: string; title: string; description: string; fields: { name: string; label: string }[] };

const phases = [
  { slug: "discovery-research", number: "01", name: "Discovery & Research" },
  { slug: "brand-strategy", number: "02", name: "Brand Strategy" },
  { slug: "visual-identity", number: "03", name: "Visual Identity System" },
  { slug: "guidelines-rollout", number: "04", name: "Guidelines & Rollout" },
];

const groups: ResearchGroup[] = [
  {
    type: "stakeholder_audit", title: "Stakeholder audit", description: "Capture what leadership believes about the business and where you need evidence.",
    fields: [
      { name: "vision_and_impact", label: "Vision and intended impact" },
      { name: "business_model", label: "Business model and value" },
      { name: "acquisition_channels", label: "How customers are acquired" },
      { name: "differentiation", label: "Current moat or differentiation" },
      { name: "five_year_ambition", label: "Five-year goals" },
      { name: "expansion_opportunities", label: "Expansion opportunities" },
      { name: "threats", label: "Threats and concerns" },
    ],
  },
  {
    type: "competitor", title: "Competitor analysis", description: "Map direct and indirect alternatives, their claims, and the openings they leave.",
    fields: [
      { name: "website", label: "Website or source" },
      { name: "direct_or_indirect", label: "Direct or indirect competitor" },
      { name: "core_messaging", label: "Core messaging" },
      { name: "feature_and_service_focus", label: "Features or services they emphasise" },
      { name: "customer_review_themes", label: "Customer review themes" },
      { name: "perceptual_axis_x", label: "Perceptual map: horizontal position" },
      { name: "perceptual_axis_y", label: "Perceptual map: vertical position" },
      { name: "vulnerabilities", label: "Vulnerabilities" },
      { name: "openings", label: "Potential openings for this brand" },
    ],
  },
  {
    type: "audience_profile", title: "Audience profile", description: "Connect external reality to internal friction and the hidden motivation behind a choice.",
    fields: [
      { name: "external_reality", label: "External reality" },
      { name: "internal_friction", label: "Internal friction" },
      { name: "hidden_motivator", label: "Hidden motivator" },
      { name: "user_role", label: "User in the decision group" },
      { name: "gatekeeper_role", label: "Gatekeeper in the decision group" },
      { name: "economic_buyer", label: "Economic buyer" },
      { name: "day_in_life", label: "A day in their life" },
      { name: "review_mining", label: "Patterns from customer reviews or interviews" },
      { name: "digital_behaviors", label: "Digital behaviours and discovery" },
      { name: "design_implications", label: "Implications for design" },
      { name: "messaging_implications", label: "Implications for messaging" },
    ],
  },
];

const phaseCopy: Record<string, { kicker: string; title: string; description: string }> = {
  "brand-strategy": { kicker: "PHASE 02", title: "Brand Strategy", description: "Turn validated research into positioning, values, voice, and a clear strategic direction." },
  "visual-identity": { kicker: "PHASE 03", title: "Visual Identity System", description: "Develop the identity assets and design system that express the approved strategy." },
  "guidelines-rollout": { kicker: "PHASE 04", title: "Guidelines & Rollout", description: "Prepare the brand for consistent use across teams, channels, and customer touchpoints." },
};

export default async function StrategyPhasePage({ params, searchParams }: PageProps) {
  const { projectId, phase } = await params;
  const query = await searchParams;
  const activePhase = phases.find((item) => item.slug === phase);
  if (!activePhase) notFound();

  const supabase = await createClient();
  const { data: claims, error: claimError } = await supabase.auth.getClaims();
  if (claimError || !claims?.claims?.sub) redirect("/login");

  const { data: project } = await supabase.from("strategy_projects").select("id,agency_id,client_id,name,current_phase,status").eq("id", projectId).maybeSingle();
  if (!project) notFound();
  const { data: teamMembership } = await supabase.from("agency_members").select("agency_id").eq("agency_id", project.agency_id).eq("user_id", claims.claims.sub).maybeSingle();
  if (!teamMembership) redirect("/portal");
  const { data: client } = await supabase.from("clients").select("name").eq("id", project.client_id).maybeSingle();
  const { data: records, error: recordsError } = phase === "discovery-research"
    ? await supabase.from("research_records").select("id,record_type,title,content,client_visible,created_at").eq("project_id", project.id).order("created_at", { ascending: false })
    : { data: [], error: null };

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="/dashboard">STRATEGY STUDIO</a>
        <form action={signOut}><button className="text-button" type="submit">Sign out</button></form>
      </header>
      <div className="project-layout">
        <aside className="project-sidebar">
          <a className="back-link" href="/dashboard">← All projects</a>
          <p className="eyebrow">{client?.name ?? "CLIENT PROJECT"}</p>
          <h1>{project.name}</h1>
          <nav className="phase-nav" aria-label="Strategy phases">
            {phases.map((item) => <a key={item.slug} aria-current={item.slug === phase ? "step" : undefined} href={`/dashboard/projects/${project.id}/${item.slug}`}><span>{item.number}</span>{item.name}</a>)}
          </nav>
        </aside>
        <section className="phase-workspace">
          {phase === "discovery-research" ? (
            <>
              <p className="eyebrow">PHASE 01 · DISCOVERY &amp; RESEARCH</p>
              <h2>Build a grounded picture of the brand</h2>
              <p className="muted">Record stakeholder perspectives, competitor evidence, and audience insight. Use research to inform strategic decisions; keep decisions and approvals with your team.</p>
              {query.saved && <p className="notice" role="status">Research saved to this project.</p>}
              {query.error && <p className="error" role="alert">We could not save that research record. Check required fields and your project access.</p>}
              {recordsError && <p className="error" role="alert">Research records could not be loaded.</p>}
              <div className="research-grid">
                {groups.map((group) => <ResearchForm key={group.type} group={group} projectId={project.id} agencyId={project.agency_id} />)}
              </div>
              <section className="records-section">
                <div className="section-heading"><div><p className="eyebrow">PROJECT EVIDENCE</p><h3>Saved research</h3></div><span>{records?.length ?? 0} records</span></div>
                {records?.length ? <div className="record-list">{records.map((record) => <details className="record-card" key={record.id}>
                  <summary><span className="record-type">{groups.find((group) => group.type === record.record_type)?.title ?? "Research"}</span><strong>{record.title}</strong><span>{record.client_visible ? "Shared with client" : "Agency only"}</span></summary>
                  <dl>{Object.entries((record.content ?? {}) as Record<string, unknown>).filter(([, value]) => String(value ?? "").trim()).map(([key, value]) => <div key={key}><dt>{labelFor(key)}</dt><dd>{String(value)}</dd></div>)}</dl>
                </details>)}</div> : <p className="empty-state">Your notes will appear here as you capture evidence.</p>}
              </section>
            </>
          ) : (
            <>
              <p className="eyebrow">{phaseCopy[phase].kicker}</p>
              <h2>{phaseCopy[phase].title}</h2>
              <p className="muted">{phaseCopy[phase].description}</p>
              <div className="panel phase-placeholder"><h3>Research first, then make the call.</h3><p>This phase is in the Strategy Engine roadmap. Your Discovery &amp; Research workspace is ready for stakeholder audits, competitor analysis, and audience profiling.</p><a className="inline-link" href={`/dashboard/projects/${project.id}/discovery-research`}>Return to Discovery &amp; Research</a></div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ResearchForm({ group, projectId, agencyId }: { group: ResearchGroup; projectId: string; agencyId: string }) {
  return <details className="research-form panel">
    <summary><span className="eyebrow">ADD RESEARCH</span><h3>{group.title}</h3><p>{group.description}</p></summary>
    <form action={createResearchRecord} className="form-grid">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="agency_id" value={agencyId} />
      <input type="hidden" name="record_type" value={group.type} />
      <label htmlFor={`${group.type}-title`}>Record title</label><input id={`${group.type}-title`} name="title" required maxLength={180} placeholder={group.title} />
      {group.fields.map((field, index) => <div className="field-block" key={field.name}><label htmlFor={`${group.type}-${field.name}`}>{field.label}</label><textarea id={`${group.type}-${field.name}`} name={field.name} rows={index === 0 ? 3 : 2} /></div>)}
      <label className="checkbox-row"><input type="checkbox" name="client_visible" /> Share this record in the client portal</label>
      <button type="submit">Save {group.title.toLowerCase()}</button>
    </form>
  </details>;
}

function labelFor(value: string) {
  return value.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

