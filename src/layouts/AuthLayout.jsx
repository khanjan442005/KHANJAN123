import { NavLink } from 'react-router-dom';

export default function AuthLayout({ tag, title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <div className="ambient-layer">
        <span className="ambient-orb orb-a" data-orbit="true"></span>
        <span className="ambient-orb orb-b" data-orbit="true"></span>
        <span className="ambient-orb orb-c" data-orbit="true"></span>
      </div>

      <main className="container-fluid-wide auth-layout">
        <section className="auth-copy-panel glass-surface tilt-card">
          <div>
            <NavLink className="brand-lockup" to="/">
              <span className="brand-mark">MC</span>
              <span className="brand-copy">
                <strong>MediCore</strong>
                <span>Doctor Appointment System</span>
              </span>
            </NavLink>

            <span className="eyebrow mt-4">{tag}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="auth-mosaic">
            <article className="auth-mini-card glass-surface">
              <span className="soft-text">Care flow</span>
              <strong>3 user roles</strong>
              <p>Dedicated access flows for patients, doctors, and administrators.</p>
            </article>

            <article className="auth-mini-card glass-surface">
              <span className="soft-text">Motion</span>
              <strong>Modern interface</strong>
              <p>Subtle depth and motion keep the experience polished without feeling heavy.</p>
            </article>

            <article className="auth-mini-card glass-surface">
              <span className="soft-text">Speed</span>
              <strong>Focused forms</strong>
              <p>Clear spacing and readable controls keep sign-in and onboarding straightforward.</p>
            </article>

            <article className="auth-mini-card glass-surface">
              <span className="soft-text">Clarity</span>
              <strong>Responsive layout</strong>
              <p>Desktop and mobile views keep the same structure and visual clarity.</p>
            </article>
          </div>
        </section>

        <section className="auth-form-panel glass-surface">{children}</section>
      </main>
    </div>
  );
}
