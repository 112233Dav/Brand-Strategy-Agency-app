"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return null;
  return { email, password };
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  return supabase;
}

export async function signIn(formData: FormData) {
  const credentials = readCredentials(formData);
  if (!credentials) redirect("/login?error=missing-fields");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) redirect("/login?error=sign-in-failed");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const credentials = readCredentials(formData);
  if (!credentials) redirect("/signup?error=missing-fields");

  const supabase = await createClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const { error } = await supabase.auth.signUp({
    ...credentials,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) redirect("/signup?error=sign-up-failed");
  redirect("/signup?message=check-email");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createAgency(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/dashboard?error=agency-name");
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("create_agency_with_owner", { agency_name: name });
  if (error) redirect("/dashboard?error=agency-create");
  redirect("/dashboard?created=agency");
}

export async function createClientRecord(formData: FormData) {
  const agencyId = String(formData.get("agency_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  if (!agencyId || !name) redirect("/dashboard?error=client-fields");

  const supabase = await authenticatedClient();
  const { error } = await supabase.from("clients").insert({ agency_id: agencyId, name, industry, website });
  if (error) redirect(`/dashboard?agency=${encodeURIComponent(agencyId)}&error=client-create`);
  redirect(`/dashboard?agency=${encodeURIComponent(agencyId)}&created=client`);
}

export async function createStrategyProject(formData: FormData) {
  const agencyId = String(formData.get("agency_id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!agencyId || !clientId || !name) redirect("/dashboard?error=project-fields");

  const supabase = await authenticatedClient();
  const { error } = await supabase.from("strategy_projects").insert({
    agency_id: agencyId,
    client_id: clientId,
    name,
    current_phase: "discovery_research",
  });
  if (error) redirect(`/dashboard?agency=${encodeURIComponent(agencyId)}&error=project-create`);
  redirect(`/dashboard?agency=${encodeURIComponent(agencyId)}&created=project`);
}

const researchFields: Record<string, string[]> = {
  stakeholder_audit: ["vision_and_impact", "business_model", "acquisition_channels", "differentiation", "five_year_ambition", "expansion_opportunities", "threats"],
  competitor: ["website", "direct_or_indirect", "core_messaging", "feature_and_service_focus", "customer_review_themes", "perceptual_axis_x", "perceptual_axis_y", "vulnerabilities", "openings"],
  audience_profile: ["external_reality", "internal_friction", "hidden_motivator", "user_role", "gatekeeper_role", "economic_buyer", "day_in_life", "review_mining", "digital_behaviors", "design_implications", "messaging_implications"],
};

export async function createResearchRecord(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const agencyId = String(formData.get("agency_id") ?? "");
  const recordType = String(formData.get("record_type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const fields = researchFields[recordType];
  if (!projectId || !agencyId || !fields || !title) redirect(`/dashboard/projects/${projectId}/discovery-research?error=research-fields`);

  const content = Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "").trim()]));
  const supabase = await authenticatedClient();
  const { error } = await supabase.from("research_records").insert({
    agency_id: agencyId,
    project_id: projectId,
    record_type: recordType,
    title,
    content,
    client_visible: formData.get("client_visible") === "on",
  });
  if (error) redirect(`/dashboard/projects/${projectId}/discovery-research?error=research-create`);
  redirect(`/dashboard/projects/${projectId}/discovery-research?saved=1`);
}

