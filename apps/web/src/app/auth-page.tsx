import type { ReactNode } from "react";

type AuthPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthPage({ eyebrow, title, subtitle, children }: AuthPageProps) {
  return (
    <main className="auth-shell">
      <nav className="auth-topbar">
        <a className="brand" href="/">
          <span className="brand-mark">P</span>
          <span>拾途 PinTrip</span>
        </a>
        <a className="ghost-button" href="/">
          返回首页
        </a>
      </nav>

      <section className="auth-layout">
        <div className="auth-visual" aria-hidden="true">
          <div className="auth-map">
            <span className="auth-pin pin-home" />
            <span className="auth-pin pin-trip" />
            <span className="auth-pin pin-done" />
            <span className="auth-route route-a" />
            <span className="auth-route route-b" />
          </div>
          <div className="auth-note note-primary">
            <strong>3 天</strong>
            <span>成都环线</span>
          </div>
          <div className="auth-note note-secondary">
            <strong>12</strong>
            <span>灵感点位</span>
          </div>
        </div>

        <div className="auth-panel">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
