import { signIn } from "@/app/actions";

type LoginPageProps = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error ? "We couldn't sign you in. If this is your first visit, create an account and confirm your email first. Otherwise, check your email and password and try again." : null;

  return (
    <main>
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">BRAND STRATEGY STUDIO</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="muted">Sign in to continue your client strategy work.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <form action={signIn} className="auth-form">
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
          <button type="submit">Sign in</button>
        </form>
        <p className="auth-footer">New to the studio? <a href="/signup">Create your account</a></p>
      </section>
    </main>
  );
}

