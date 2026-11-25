import { signUp } from "@/app/actions";

type SignupPageProps = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const confirmationSent = params.message === "check-email";
  const error = params.error ? "We couldn't create the account. Check the details and try again." : null;

  return (
    <main>
      <section className="auth-card" aria-labelledby="signup-title">
        <p className="eyebrow">BRAND STRATEGY STUDIO</p>
        <h1 id="signup-title">Create your account</h1>
        <p className="muted">Use your work email. We’ll send you a link to confirm it before you enter the workspace.</p>
        {confirmationSent && <p className="notice" role="status">Check your inbox for the confirmation link. Open it to activate your account and continue to the dashboard.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {!confirmationSent && <form action={signUp} className="auth-form">
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Create a password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          <button type="submit">Create account</button>
        </form>}
        <p className="auth-footer"><a href="/login">Already have an account? Sign in</a></p>
      </section>
    </main>
  );
}

