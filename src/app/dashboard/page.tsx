import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/login?setup=supabase");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : data?.claims;

  if (!claims) redirect("/login");

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="/dashboard">STRATEGY STUDIO</a>
        <form action={signOut}><button className="text-button" type="submit">Sign out</button></form>
      </header>
      <section className="dashboard-content">
        <p className="eyebrow">AGENCY WORKSPACE</p>
        <h1>Your strategy projects</h1>
        <p className="muted">The secure workspace is ready. Client and project tools will appear here as the Strategy Engine is built.</p>
        <div className="phase-list">
          <article><span>01</span><div><h2>Discovery &amp; Research</h2><p>Stakeholder audits, market analysis, and audience profiles</p></div></article>
          <article><span>02</span><div><h2>Brand Strategy</h2><p>Positioning, values, voice, and creative direction</p></div></article>
          <article><span>03</span><div><h2>Visual Identity System</h2><p>Identity assets, typography, color, and design systems</p></div></article>
          <article><span>04</span><div><h2>Guidelines &amp; Rollout</h2><p>Brand governance, touchpoints, and handover</p></div></article>
        </div>
      </section>
    </main>
  );
}
