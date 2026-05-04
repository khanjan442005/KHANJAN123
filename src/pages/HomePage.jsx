import { NavLink } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="hero-shell" id="overview">
      <div className="container-fluid-wide">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Smart healthcare access</span>
            <h1 className="hero-title">Professional appointment management for patients, doctors, and administrators.</h1>
            <p className="hero-text">
              MediCore brings booking, approvals, doctor schedules, and daily operations into one practical healthcare workspace. The
              experience is designed to feel modern, calm, and organized instead of empty or confusing.
            </p>

            <div className="hero-actions">
              <NavLink className="btn-brand" to="/auth/login">
                Login
              </NavLink>
              <NavLink className="btn-brand-outline" to="/auth/register">
                Register
              </NavLink>
            </div>

            <div className="hero-badges">
              <span className="status-tag">Patient booking</span>
              <span className="status-tag">Doctor scheduling</span>
              <span className="status-tag">Admin approvals</span>
            </div>

            <div className="hero-metrics">
              <article className="metric-card glass-surface tilt-card">
                <span className="soft-text">User roles</span>
                <strong>3</strong>
                <span>Patient, doctor, and admin workflows with separate dashboards.</span>
              </article>
              <article className="metric-card glass-surface tilt-card">
                <span className="soft-text">Design style</span>
                <strong>Modern</strong>
                <span>Subtle motion, layered cards, and clean healthcare-oriented visuals.</span>
              </article>
              <article className="metric-card glass-surface tilt-card">
                <span className="soft-text">Navigation</span>
                <strong>Clear</strong>
                <span>Readable sections and direct actions across the full application.</span>
              </article>
            </div>
          </div>

          <div className="hero-stage">
            <div className="holo-platform glass-surface tilt-card">
              <div className="stage-panel">
                <span className="eyebrow">System overview</span>
                <h3>24/7</h3>
                <p className="mb-0">Appointments, approvals, and notifications stay organized in one unified platform.</p>
              </div>

              <div className="stage-stack">
                <article className="stage-mini">
                  <span className="soft-text">Doctors</span>
                  <strong>128 active profiles</strong>
                </article>
                <article className="stage-mini">
                  <span className="soft-text">Patients</span>
                  <strong>312 booking requests</strong>
                </article>
                <article className="stage-mini">
                  <span className="soft-text">Approvals</span>
                  <strong>24 pending reviews</strong>
                </article>
                <article className="stage-mini">
                  <span className="soft-text">Turnaround</span>
                  <strong>Under 3 minutes</strong>
                </article>
              </div>
            </div>
          </div>
        </div>

        <section className="home-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Live overview</span>
              <h3 className="home-section-title">One platform with all essential healthcare actions in view.</h3>
            </div>
            <p className="home-section-copy mb-0">The landing page now gives a fuller picture of what the system handles every day.</p>
          </div>

          <div className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Daily bookings</span>
              <strong>312</strong>
              <span>Patients can request and confirm appointments from one place.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Active specialists</span>
              <strong>128</strong>
              <span>Doctors manage schedules, profiles, and visit queues clearly.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Approval queue</span>
              <strong>24</strong>
              <span>Admin review remains visible without slowing operational flow.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Response window</span>
              <strong>3 min</strong>
              <span>Fast access and clear actions reduce friction across the portal.</span>
            </article>
          </div>
        </section>

        <section className="home-section" id="workflows">
          <div className="section-head">
            <div>
              <span className="eyebrow">Workflows</span>
              <h3 className="home-section-title">Dedicated flows for patient care, clinical work, and administration.</h3>
            </div>
            <p className="home-section-copy mb-0">
              The system separates responsibilities while keeping the overall experience consistent.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card glass-surface tilt-card">
              <h3>Patient-friendly flow</h3>
              <p className="mb-0">Appointments, profiles, payments, and notifications stay easier to access and understand.</p>
            </article>
            <article className="feature-card glass-surface tilt-card">
              <h3>Doctor workflow</h3>
              <p className="mb-0">Schedule, availability, earnings, and daily visits are grouped with cleaner spacing and hierarchy.</p>
            </article>
            <article className="feature-card glass-surface tilt-card">
              <h3>Admin management</h3>
              <p className="mb-0">Reports, verification, and user management are structured for day-to-day operational use.</p>
            </article>
          </div>
        </section>

        <section className="home-section" id="about">
          <div className="dual-grid">
            <article className="section-card glass-surface home-about-card">
              <span className="eyebrow">About MediCore</span>
              <h2 className="home-block-title">A more complete doctor appointment system for everyday healthcare operations.</h2>
              <p>
                MediCore is built to bring the patient journey, doctor workload, and admin oversight into one balanced system. Instead
                of splitting work across disconnected screens, it keeps booking, profile management, availability, approvals, and alerts
                aligned.
              </p>
              <p className="mb-0">
                The design direction focuses on clarity first: clean sections, visible actions, responsive layouts, and a calmer visual
                style that still feels professional for hospitals, clinics, and appointment teams.
              </p>

              <div className="about-list">
                <article className="about-item">
                  <strong>For patients</strong>
                  <span>Find doctors, book visits, review history, and manage notifications.</span>
                </article>
                <article className="about-item">
                  <strong>For doctors</strong>
                  <span>Track appointments, set availability, update profile, and review earnings.</span>
                </article>
                <article className="about-item">
                  <strong>For admins</strong>
                  <span>Approve doctors, monitor reports, and manage the overall platform.</span>
                </article>
              </div>
            </article>

            <div className="about-cluster">
              <article className="section-card glass-surface">
                <span className="soft-text">Platform focus</span>
                <h3 className="mt-2">Why this home page feels fuller now</h3>
                <p className="mb-0">
                  More sections give visitors immediate context about the system, not just one hero block. It now explains the product,
                  the workflow, and the practical value.
                </p>
              </article>

              <article className="section-card glass-surface">
                <div className="section-head">
                  <div>
                    <span className="soft-text">System journey</span>
                    <h3 className="mb-0">How the platform flows</h3>
                  </div>
                </div>

                <div className="timeline-list">
                  <article className="timeline-item">
                    <span className="timeline-slot">01</span>
                    <div className="timeline-copy">
                      <strong>Patient sends a request</strong>
                      <p className="mb-0">Appointments start with a simple booking flow and visible doctor details.</p>
                    </div>
                    <span className="status-tag">Booking</span>
                  </article>
                  <article className="timeline-item">
                    <span className="timeline-slot">02</span>
                    <div className="timeline-copy">
                      <strong>Doctor manages schedule</strong>
                      <p className="mb-0">Availability and appointment queues remain organized from one dashboard.</p>
                    </div>
                    <span className="status-tag">Schedule</span>
                  </article>
                  <article className="timeline-item">
                    <span className="timeline-slot">03</span>
                    <div className="timeline-copy">
                      <strong>Admin monitors the system</strong>
                      <p className="mb-0">Verification, reports, and operations stay available for fast action.</p>
                    </div>
                    <span className="status-tag">Control</span>
                  </article>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Role highlights</span>
              <h3 className="home-section-title">Separate workspaces designed for each type of user.</h3>
            </div>
            <p className="home-section-copy mb-0">
              Each role keeps its own navigation, tasks, and decision points without losing consistency.
            </p>
          </div>

          <div className="role-option-grid home-role-grid">
            <article className="role-option glass-surface tilt-card">
              <strong>Patient area</strong>
              <p className="mb-0">Browse doctors, manage bookings, confirm payments, and keep appointment history close.</p>
            </article>
            <article className="role-option glass-surface tilt-card">
              <strong>Doctor area</strong>
              <p className="mb-0">Handle clinical schedule, working slots, visit pipeline, and performance insights.</p>
            </article>
            <article className="role-option glass-surface tilt-card">
              <strong>Admin area</strong>
              <p className="mb-0">Supervise registrations, reports, doctor approvals, and overall platform activity.</p>
            </article>
          </div>
        </section>

        <section className="home-section">
          <article className="home-cta glass-surface">
            <div>
              <span className="eyebrow">Ready to enter</span>
              <h2 className="home-block-title">Access the dashboard and continue with your healthcare workflow.</h2>
              <p className="mb-0">Use the secure login to move into the patient, doctor, or admin experience.</p>
            </div>

            <div className="hero-actions home-cta-actions">
              <NavLink className="btn-brand" to="/auth/login">
                Login
              </NavLink>
              <NavLink className="btn-brand-outline" to="/auth/register">
                Create account
              </NavLink>
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}
