import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { routeForRole } from '../utils/routes';

export default function PublicLayout({ children }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    setMenuOpen(false);
    navigate('/auth/login');
  }

  return (
    <div className="public-shell">
      <div className="ambient-layer">
        <span className="ambient-orb orb-a" data-orbit="true"></span>
        <span className="ambient-orb orb-b" data-orbit="true"></span>
        <span className="ambient-orb orb-c" data-orbit="true"></span>
      </div>

      <header className="public-header">
        <div className="container-fluid-wide">
          <div className="public-nav-shell glass-surface">
            <NavLink className="brand-lockup" to="/">
              <span className="brand-mark">MC</span>
              <span className="brand-copy">
                <strong>MediCore</strong>
                <span>Doctor Appointment System</span>
              </span>
            </NavLink>

            <button className={`nav-toggle ${menuOpen ? 'is-active' : ''}`} type="button" onClick={() => setMenuOpen((current) => !current)}>
              <span className="nav-toggle-box" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
              Menu
            </button>

            <div className={`public-nav-panel ${menuOpen ? 'is-open' : ''}`}>
              <nav className="public-nav-links" aria-label="Main navigation">
                <NavLink className={({ isActive }) => `public-link ${isActive ? 'active' : ''}`} to="/" onClick={() => setMenuOpen(false)}>
                  Home
                </NavLink>
                <a className="public-link" href="/#workflows">
                  Workflows
                </a>
                <a className="public-link" href="/#about">
                  About
                </a>
              </nav>

              <div className="nav-actions">
                {session.user ? (
                  <>
                    <NavLink className="btn-brand-outline" to={routeForRole(session.user.role)} onClick={() => setMenuOpen(false)}>
                      {session.user.role} dashboard
                    </NavLink>
                    <button className="btn-brand" type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </>
                ) : (
                  <NavLink className="btn-brand" to="/auth/login" onClick={() => setMenuOpen(false)}>
                    Login
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="public-main">{children}</main>

      <footer className="public-footer">
        <div className="container-fluid-wide">
          Copyright {new Date().getFullYear()} MediCore. Patient, doctor, and admin workflows in one system.
        </div>
      </footer>
    </div>
  );
}
