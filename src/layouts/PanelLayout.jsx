import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PanelLayout({
  theme,
  pageBadge,
  pageTitle,
  pageSubtitle,
  brandTitle,
  brandSubtitle,
  roleBadge,
  roleDescription,
  navItems,
  status,
  contextPills,
  actionLink,
  userRoleLabel,
  children
}) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    setMenuOpen(false);
    navigate('/auth/login');
  }

  return (
    <div className={`panel-shell ${theme}`}>
      <div className="ambient-layer">
        <span className="ambient-orb orb-a" data-orbit="true"></span>
        <span className="ambient-orb orb-b" data-orbit="true"></span>
        <span className="ambient-orb orb-c" data-orbit="true"></span>
      </div>

      <div className="panel-layout">
        <aside className="panel-sidebar glass-surface">
          <div className="panel-sidebar-top">
            <NavLink className="brand-lockup" to={navItems[0]?.to || '/'}>
              <span className="brand-mark">MC</span>
              <span className="brand-copy">
                <strong>{brandTitle}</strong>
                <span>{brandSubtitle}</span>
              </span>
            </NavLink>

            <button className={`nav-toggle panel-nav-toggle ${menuOpen ? 'is-active' : ''}`} type="button" onClick={() => setMenuOpen((current) => !current)}>
              <span className="nav-toggle-box" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
              Menu
            </button>
          </div>

          <div className={`panel-sidebar-body ${menuOpen ? 'is-open' : ''}`}>
            <section className="panel-role-card">
              <div className="panel-role-copy">
                <span className="panel-role-badge">{roleBadge}</span>
                <strong>{session.user?.displayName}</strong>
                <p className="soft-text mb-0">{roleDescription}</p>
              </div>
              <span className="avatar-pill avatar-pill-lg">{session.user?.initials}</span>
            </section>

            <div className="panel-nav-head">
              <span className="soft-text">Navigation grid</span>
              <strong>{brandSubtitle}</strong>
            </div>

            <nav className="panel-nav" aria-label={`${brandTitle} navigation`}>
              {navItems.map((item) => (
                <NavLink key={item.to} className={({ isActive }) => `panel-link ${isActive ? 'active' : ''}`} to={item.to} onClick={() => setMenuOpen(false)}>
                  <span className="panel-link-copy">
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <span className="panel-link-index">{item.index}</span>
                </NavLink>
              ))}
            </nav>

            <section className="panel-status glass-surface tilt-card">
              <span className="soft-text">{status.label}</span>
              <strong>{status.title}</strong>
              <p className="soft-text mb-0">{status.description}</p>
            </section>
          </div>
        </aside>

        <div className="panel-main">
          <header className="panel-topbar glass-surface">
            <div className="panel-heading">
              <span className="eyebrow">{pageBadge}</span>
              <h1>{pageTitle}</h1>
              <p className="soft-text mb-0">{pageSubtitle}</p>
            </div>

            <div className="panel-topbar-actions">
              <div className="panel-context-line">
                {contextPills.map((pill) => (
                  <span key={`${pill.label}-${pill.subtle ? 'subtle' : 'solid'}`} className={`panel-context-pill ${pill.subtle ? 'subtle' : ''}`}>
                    {pill.label}
                  </span>
                ))}
              </div>

              <div className="panel-action-row">
                {actionLink ? (
                  <NavLink className="btn-surface" to={actionLink.to} onClick={() => setMenuOpen(false)}>
                    {actionLink.label}
                  </NavLink>
                ) : null}
                <button className="btn-brand-outline" type="button" onClick={handleLogout}>
                  Log Out
                </button>
                <div className="panel-user-chip">
                  <span className="avatar-pill">{session.user?.initials}</span>
                  <div className="panel-user-meta">
                    <strong>{session.user?.displayName}</strong>
                    <span className="panel-user-role">{userRoleLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="panel-page">{children}</main>
        </div>
      </div>
    </div>
  );
}
