import { signIn, signUp } from "@/app/actions";

type LoginPageProps = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message = params.message === "check-email" ? "Check your email to confirm your account." : null;
  const error = params.error ? "We could not complete that request. Check your details and try again." : null;

  return (
    <main>
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">BRAND STRATEGY STUDIO</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="muted">Sign in to continue your client strategy work.</p>
        {message && <p className="notice" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <form action={signIn} className="auth-form">
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
          <button type="submit">Sign in</button>
          <button className="secondary-button" formAction={signUp} type="submit">Create an account</button>
        </form>
      </section>
    </main>
  );
}
