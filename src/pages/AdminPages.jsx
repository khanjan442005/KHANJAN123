import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { padCount } from '../utils/formatters';
import {
  approveDoctorRequest,
  createAdminDoctor,
  deleteAdminDoctor,
  getAdminAppointments,
  getAdminDashboard,
  getAdminReports,
  getAdminUsers,
  getDoctorVerification,
  rejectDoctorRequest
} from '../services/admin';
import { getErrorMessage } from '../services/http';
import PanelLayout from '../layouts/PanelLayout';
import { useApiQuery } from '../hooks/useApiQuery';

const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Overview', hint: 'Platform snapshot', index: '01' },
  { to: '/admin/doctor-verification', label: 'Doctor Review', hint: 'Handle approvals', index: '02' },
  { to: '/admin/reports', label: 'Reports', hint: 'Review analytics', index: '03' },
  { to: '/admin/users', label: 'User Management', hint: 'Control access', index: '04' },
  { to: '/admin/appointments', label: 'Appointments', hint: 'Inspect bookings', index: '05' },
  { to: '/admin/add-doctor', label: 'Add Doctor', hint: 'Create practitioner records', index: '06' }
];

function AdminLayout({ pageTitle, pageSubtitle, status, contextPills, children }) {
  return (
    <PanelLayout
      actionLink={{ to: '/admin/reports', label: 'Reports' }}
      brandSubtitle="System dashboard"
      brandTitle="Admin Panel"
      contextPills={contextPills}
      navItems={ADMIN_NAV_ITEMS}
      pageBadge="Admin Panel"
      pageSubtitle={pageSubtitle}
      pageTitle={pageTitle}
      roleBadge="Admin workspace"
      roleDescription="Approvals, reports, and system control now sit inside one sharper operations menu."
      status={status}
      theme="panel-admin"
      userRoleLabel="Administrator"
    >
      {children}
    </PanelLayout>
  );
}

function ErrorAlert({ message }) {
  if (!message) {
    return null;
  }

  return <div className="alert alert-danger mb-4">{message}</div>;
}

function SuccessAlert({ message }) {
  if (!message) {
    return null;
  }

  return <div className="alert alert-success mb-4">{message}</div>;
}

function LoadingCard() {
  return (
    <section className="section-card glass-surface">
      <p className="mb-0">Loading...</p>
    </section>
  );
}

export function AdminDashboardPage() {
  const { data, loading, error } = useApiQuery(() => getAdminDashboard(), []);
  const metrics = data?.metrics;

  return (
    <AdminLayout
      contextPills={[
        { label: `${padCount(metrics?.pendingDoctorVerifications)} pending reviews` },
        { label: metrics?.revenueLabel || 'INR 0 tracked revenue', subtle: true }
      ]}
      pageSubtitle="Review platform growth, approvals, and live activity fed by patient and doctor actions."
      pageTitle="Admin Overview"
      status={{
        label: 'System pulse',
        title: `${padCount(metrics?.pendingDoctorVerifications)} requests waiting for review`,
        description: `${padCount(metrics?.weeklyAppointments)} weekly appointments and ${padCount(metrics?.pendingPayments)} payment follow-ups are active right now.`
      }}
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="panel-hero glass-surface tilt-card">
            <span className="eyebrow">Admin summary</span>
            <h2>System overview at a glance.</h2>
            <p className="soft-text mb-0">Doctor approvals, patient bookings, revenue, and payment follow-ups are now grouped into one stronger operations dashboard.</p>
          </section>

          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Total doctors</span>
              <strong>{padCount(data.metrics.totalDoctors)}</strong>
              <span className="soft-text">Verified providers across specialties.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Total patients</span>
              <strong>{padCount(data.metrics.totalPatients)}</strong>
              <span className="soft-text">Registered patient accounts in the system.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Appointments</span>
              <strong>{padCount(data.metrics.totalAppointments)}</strong>
              <span className="soft-text">Created from the connected booking flow.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Revenue</span>
              <strong>{data.metrics.revenueLabel}</strong>
              <span className="soft-text">Paid consultation snapshot.</span>
            </article>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Priority items</span>
                  <h3>Priority operations</h3>
                </div>
              </div>

              <div className="timeline-list">
                <article className="timeline-item">
                  <div className="timeline-slot">{padCount(data.metrics.pendingDoctorVerifications)}</div>
                  <div className="timeline-copy">
                    <strong>Doctor verifications</strong>
                    <span>Profiles waiting for credential approval.</span>
                  </div>
                  <span className="status-tag">Queue</span>
                </article>
                <article className="timeline-item">
                  <div className="timeline-slot">{padCount(data.metrics.pendingPayments)}</div>
                  <div className="timeline-copy">
                    <strong>Payment pending bookings</strong>
                    <span>Appointments created by patients but not fully paid yet.</span>
                  </div>
                  <span className="status-tag">Open</span>
                </article>
                <article className="timeline-item">
                  <div className="timeline-slot">{padCount(data.metrics.activeDoctors)}</div>
                  <div className="timeline-copy">
                    <strong>Active doctors</strong>
                    <span>Approved doctors already visible in the patient directory.</span>
                  </div>
                  <span className="status-tag">Live</span>
                </article>
                <article className="timeline-item">
                  <div className="timeline-slot">{padCount(data.metrics.newRegistrations)}</div>
                  <div className="timeline-copy">
                    <strong>Recent registrations</strong>
                    <span>Patients and doctors added during the current activity window.</span>
                  </div>
                  <span className="status-tag">Growth</span>
                </article>
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Quick actions</span>
                  <h3>Quick controls</h3>
                </div>
              </div>

              <div className="d-grid gap-3">
                <Link className="btn-brand" to="/admin/doctor-verification">
                  Review doctors
                </Link>
                <Link className="btn-brand-outline" to="/admin/users">
                  Manage users
                </Link>
                <Link className="btn-brand-outline" to="/admin/appointments">
                  View appointments
                </Link>
                <Link className="btn-brand-outline" to="/admin/reports">
                  Open reports
                </Link>
                <Link className="btn-brand-outline" to="/admin/add-doctor">
                  Add doctor
                </Link>
              </div>
            </article>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Recent requests</span>
                  <h3>Latest doctor applications</h3>
                </div>
                <Link className="btn-brand-outline" to="/admin/doctor-verification">
                  Open queue
                </Link>
              </div>

              <div className="timeline-list">
                {data.recentDoctorRequests.length > 0 ? (
                  data.recentDoctorRequests.map((request) => (
                    <article key={request.id} className="timeline-item">
                      <div className="timeline-slot">{new Date(request.requestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                      <div className="timeline-copy">
                        <strong>{request.fullName}</strong>
                        <span>
                          {request.specialization} - {request.city}
                        </span>
                      </div>
                      <span className="status-tag">{request.status}</span>
                    </article>
                  ))
                ) : (
                  <article className="timeline-item">
                    <div className="timeline-copy">
                      <strong>No doctor requests found.</strong>
                      <span>New verification requests will appear here automatically.</span>
                    </div>
                    <span className="status-tag">Clear</span>
                  </article>
                )}
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Recent bookings</span>
                  <h3>Latest appointment activity</h3>
                </div>
                <Link className="btn-brand-outline" to="/admin/appointments">
                  Full list
                </Link>
              </div>

              <div className="table-theme glass-surface">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAppointments.length > 0 ? (
                      data.recentAppointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td>
                            <strong>{appointment.patientName}</strong>
                            <div className="soft-text">
                              {appointment.dateLabel} - {appointment.timeSlot}
                            </div>
                          </td>
                          <td>
                            <strong>{appointment.doctorName}</strong>
                            <div className="soft-text">{appointment.doctorSpecialization}</div>
                          </td>
                          <td>
                            <span className="status-tag">{appointment.status}</span>
                          </td>
                          <td>
                            <strong>{appointment.paymentStatus}</strong>
                            <div className="soft-text">{appointment.paymentMethod}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="text-center py-4" colSpan="4">
                          No appointment activity is available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export function AdminDoctorVerificationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('searchTerm') || '';
  const statusFilter = searchParams.get('statusFilter') || 'Pending';
  const { data, loading, error, reload } = useApiQuery(() => getDoctorVerification({ searchTerm, statusFilter }), [searchTerm, statusFilter]);
  const [flash, setFlash] = useState('');
  const [actionError, setActionError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextParams = new URLSearchParams();
    const nextSearchTerm = String(formData.get('searchTerm') || '').trim();
    const nextStatus = String(formData.get('statusFilter') || 'Pending');

    if (nextSearchTerm) {
      nextParams.set('searchTerm', nextSearchTerm);
    }

    if (nextStatus && nextStatus !== 'Pending') {
      nextParams.set('statusFilter', nextStatus);
    }

    setSearchParams(nextParams);
  }

  async function handleApprove(requestId) {
    setActionError('');
    setFlash('');

    try {
      const response = await approveDoctorRequest(requestId);
      setFlash(response.message);
      reload();
    } catch (actionFailure) {
      setActionError(getErrorMessage(actionFailure));
    }
  }

  async function handleReject(requestId) {
    setActionError('');
    setFlash('');

    try {
      const response = await rejectDoctorRequest(requestId);
      setFlash(response.message);
      reload();
    } catch (actionFailure) {
      setActionError(getErrorMessage(actionFailure));
    }
  }

  return (
    <AdminLayout
      contextPills={[
        { label: `${padCount(data?.pendingRequestsCount)} pending approvals` },
        { label: `${padCount(data?.verifiedDoctorsCount)} verified doctors`, subtle: true }
      ]}
      pageSubtitle="Approve or reject doctor requests. Approved doctors will appear in the patient directory immediately."
      pageTitle="Doctor Verification"
      status={{
        label: 'System pulse',
        title: `${padCount(data?.pendingRequestsCount)} requests waiting for review`,
        description: `${padCount(data?.approvedRequestsCount)} approved and ${padCount(data?.rejectedRequestsCount)} rejected requests are already resolved.`
      }}
    >
      <ErrorAlert message={error || actionError} />
      <SuccessAlert message={flash} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Pending approvals</span>
              <strong>{padCount(data.pendingRequestsCount)}</strong>
              <span className="soft-text">Requests that still need an admin decision.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Approved requests</span>
              <strong>{padCount(data.approvedRequestsCount)}</strong>
              <span className="soft-text">Doctor signups that already passed review.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Rejected requests</span>
              <strong>{padCount(data.rejectedRequestsCount)}</strong>
              <span className="soft-text">Applications that were declined by the admin team.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Verified doctors</span>
              <strong>{padCount(data.verifiedDoctorsCount)}</strong>
              <span className="soft-text">Live providers currently visible to patients.</span>
            </article>
          </section>

          <section className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Verification queue</span>
                <h3>Doctor approval workspace</h3>
              </div>
            </div>

            <form className="row g-3 align-items-end mb-4" onSubmit={handleSubmit}>
              <div className="col-lg-6">
                <label className="auth-label">Search</label>
                <input className="form-control" defaultValue={searchTerm} name="searchTerm" placeholder="Name, email, specialization, hospital, city" />
              </div>
              <div className="col-lg-3">
                <label className="auth-label">Status</label>
                <select className="form-select" defaultValue={statusFilter} name="statusFilter">
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="All">All statuses</option>
                </select>
              </div>
              <div className="col-lg-3 d-grid">
                <button className="btn-brand" type="submit">
                  Apply filters
                </button>
              </div>
            </form>

            <div className="table-theme glass-surface">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Location</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.requests.length > 0 ? (
                    data.requests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <strong>{request.fullName}</strong>
                          <div className="soft-text">{request.email}</div>
                          <div className="soft-text">License: {request.licenseNumber}</div>
                        </td>
                        <td>
                          <strong>{request.specialization}</strong>
                          <div className="soft-text">{request.experienceYears} years experience</div>
                        </td>
                        <td>
                          <strong>{request.city}</strong>
                          <div className="soft-text">{request.hospitalName}</div>
                        </td>
                        <td>{new Date(request.requestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td>
                          <span className="status-tag">{request.status}</span>
                        </td>
                        <td>
                          {request.status === 'Pending' ? (
                            <div className="d-flex gap-2 flex-wrap">
                              <button className="btn btn-success btn-sm" type="button" onClick={() => handleApprove(request.id)}>
                                Approve
                              </button>
                              <button className="btn btn-brand-outline btn-sm" type="button" onClick={() => handleReject(request.id)}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="soft-text">Already reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="text-center py-4" colSpan="6">
                        No doctor requests matched the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export function AdminAppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('searchTerm') || '';
  const statusFilter = searchParams.get('statusFilter') || 'All';
  const paymentFilter = searchParams.get('paymentFilter') || 'All';
  const { data, loading, error } = useApiQuery(() => getAdminAppointments({ searchTerm, statusFilter, paymentFilter }), [searchTerm, statusFilter, paymentFilter]);

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextParams = new URLSearchParams();
    const nextSearchTerm = String(formData.get('searchTerm') || '').trim();
    const nextStatus = String(formData.get('statusFilter') || 'All');
    const nextPayment = String(formData.get('paymentFilter') || 'All');

    if (nextSearchTerm) {
      nextParams.set('searchTerm', nextSearchTerm);
    }

    if (nextStatus && nextStatus !== 'All') {
      nextParams.set('statusFilter', nextStatus);
    }

    if (nextPayment && nextPayment !== 'All') {
      nextParams.set('paymentFilter', nextPayment);
    }

    setSearchParams(nextParams);
  }

  return (
    <AdminLayout
      contextPills={[
        { label: `${padCount(data?.totalAppointmentsCount)} visible appointments` },
        { label: data?.revenueLabel || 'INR 0', subtle: true }
      ]}
      pageSubtitle="Review every booking, payment state, and assigned doctor from one admin view."
      pageTitle="Appointments"
      status={{
        label: 'System pulse',
        title: `${padCount(data?.pendingPaymentsCount)} payment follow-ups`,
        description: `${data?.revenueLabel || 'INR 0'} tracked within the current filtered appointment set.`
      }}
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Visible appointments</span>
              <strong>{padCount(data.totalAppointmentsCount)}</strong>
              <span className="soft-text">Rows matched by the current search and filters.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Confirmed</span>
              <strong>{padCount(data.confirmedAppointmentsCount)}</strong>
              <span className="soft-text">Appointments already confirmed after payment.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Completed</span>
              <strong>{padCount(data.completedAppointmentsCount)}</strong>
              <span className="soft-text">Visits already completed in the current data set.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Filtered revenue</span>
              <strong>{data.revenueLabel}</strong>
              <span className="soft-text">{padCount(data.pendingPaymentsCount)} payment follow-ups still open.</span>
            </article>
          </section>

          <section className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Bookings</span>
                <h3>Platform appointments</h3>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <Link className="btn-brand-outline" to="/admin/users">
                  Users
                </Link>
                <Link className="btn-brand-outline" to="/admin/reports">
                  Reports
                </Link>
              </div>
            </div>

            <form className="row g-3 align-items-end mb-4" onSubmit={handleSubmit}>
              <div className="col-lg-5">
                <label className="auth-label">Search</label>
                <input className="form-control" defaultValue={searchTerm} name="searchTerm" placeholder="Patient, doctor, specialization, date, payment" />
              </div>
              <div className="col-lg-3">
                <label className="auth-label">Status</label>
                <select className="form-select" defaultValue={statusFilter} name="statusFilter">
                  <option value="All">All statuses</option>
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="col-lg-2">
                <label className="auth-label">Payment</label>
                <select className="form-select" defaultValue={paymentFilter} name="paymentFilter">
                  <option value="All">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="col-lg-2 d-grid">
                <button className="btn-brand" type="submit">
                  Apply
                </button>
              </div>
            </form>

            <div className="table-theme glass-surface">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.appointments.length > 0 ? (
                    data.appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{appointment.patientName}</td>
                        <td>
                          <strong>{appointment.doctorName}</strong>
                          <div className="soft-text">{appointment.doctorSpecialization}</div>
                        </td>
                        <td>
                          <strong>{appointment.dateLabel}</strong>
                          <div className="soft-text">{appointment.timeSlot}</div>
                        </td>
                        <td>
                          <span className="status-tag">{appointment.status}</span>
                        </td>
                        <td>
                          <strong>{appointment.paymentStatus}</strong>
                          <div className="soft-text">{appointment.paymentMethod}</div>
                        </td>
                        <td>{appointment.feeLabel}</td>
                        <td>{appointment.createdAtLabel}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="text-center py-4" colSpan="7">
                        No appointments matched the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export function AdminUserManagementPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('searchTerm') || '';
  const roleFilter = searchParams.get('roleFilter') || 'All';
  const statusFilter = searchParams.get('statusFilter') || 'All';
  const { data, loading, error, reload } = useApiQuery(() => getAdminUsers({ searchTerm, roleFilter, statusFilter }), [searchTerm, roleFilter, statusFilter]);
  const [flash, setFlash] = useState(location.state?.success || '');
  const [actionError, setActionError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextParams = new URLSearchParams();
    const nextSearchTerm = String(formData.get('searchTerm') || '').trim();
    const nextRole = String(formData.get('roleFilter') || 'All');
    const nextStatus = String(formData.get('statusFilter') || 'All');

    if (nextSearchTerm) {
      nextParams.set('searchTerm', nextSearchTerm);
    }

    if (nextRole && nextRole !== 'All') {
      nextParams.set('roleFilter', nextRole);
    }

    if (nextStatus && nextStatus !== 'All') {
      nextParams.set('statusFilter', nextStatus);
    }

    setSearchParams(nextParams);
  }

  async function handleDeleteDoctor(doctorId) {
    setActionError('');
    setFlash('');

    try {
      const response = await deleteAdminDoctor(doctorId);
      setFlash(response.message);
      reload();
    } catch (actionFailure) {
      setActionError(getErrorMessage(actionFailure));
    }
  }

  return (
    <AdminLayout
      contextPills={[
        { label: `${padCount(data?.patientCount)} patients` },
        { label: `${padCount(data?.verifiedDoctorCount)} verified doctors`, subtle: true }
      ]}
      pageSubtitle="Review patients and doctors from the same live data source used by the role dashboards."
      pageTitle="User Management"
      status={{
        label: 'System pulse',
        title: `${padCount(data?.pendingDoctorCount)} pending doctor profiles`,
        description: `${padCount(data?.patientCount)} patients and ${padCount(data?.verifiedDoctorCount)} verified doctors are visible in the system.`
      }}
    >
      <ErrorAlert message={error || actionError} />
      <SuccessAlert message={flash} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Patients</span>
              <strong>{padCount(data.patientCount)}</strong>
              <span className="soft-text">Active patient accounts in the platform.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Verified doctors</span>
              <strong>{padCount(data.verifiedDoctorCount)}</strong>
              <span className="soft-text">Approved doctors available for booking.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Pending doctors</span>
              <strong>{padCount(data.pendingDoctorCount)}</strong>
              <span className="soft-text">Doctor profiles still waiting for admin action.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Visible results</span>
              <strong>{padCount(data.users.length)}</strong>
              <span className="soft-text">Rows matched by the current filters.</span>
            </article>
          </section>

          <section className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Accounts</span>
                <h3>System users</h3>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <Link className="btn-brand" to="/admin/add-doctor">
                  Add doctor
                </Link>
                <Link className="btn-brand-outline" to="/admin/appointments">
                  Appointments
                </Link>
                <Link className="btn-brand-outline" to="/admin/doctor-verification">
                  Doctor review
                </Link>
              </div>
            </div>

            <form className="row g-3 align-items-end mb-4" onSubmit={handleSubmit}>
              <div className="col-lg-5">
                <label className="auth-label">Search</label>
                <input className="form-control" defaultValue={searchTerm} name="searchTerm" placeholder="Name, email, specialization, role, or status" />
              </div>
              <div className="col-lg-3">
                <label className="auth-label">Role</label>
                <select className="form-select" defaultValue={roleFilter} name="roleFilter">
                  <option value="All">All roles</option>
                  <option value="Patient">Patient</option>
                  <option value="Doctor">Doctor</option>
                </select>
              </div>
              <div className="col-lg-2">
                <label className="auth-label">Status</label>
                <select className="form-select" defaultValue={statusFilter} name="statusFilter">
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Verified">Verified</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="col-lg-2 d-grid">
                <button className="btn-brand" type="submit">
                  Apply
                </button>
              </div>
            </form>

            <div className="table-theme glass-surface">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Detail</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.length > 0 ? (
                    data.users.map((user) => (
                      <tr key={`${user.role}-${user.entityId}`}>
                        <td>
                          <strong>{user.name}</strong>
                        </td>
                        <td>{user.role}</td>
                        <td>
                          <span className="status-tag">{user.status}</span>
                        </td>
                        <td>{user.detail}</td>
                        <td>
                          {user.canDelete ? (
                            <button className="btn btn-danger btn-sm" type="button" onClick={() => handleDeleteDoctor(user.entityId)}>
                              Delete doctor
                            </button>
                          ) : (
                            <span className="soft-text">No action</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="text-center py-4" colSpan="5">
                        No users matched the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export function AdminAddDoctorPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    specialization: '',
    license: '',
    experienceYears: 5,
    city: '',
    consultationFee: 700,
    hospitalName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await createAdminDoctor({
        ...form,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee)
      });

      navigate('/admin/users', {
        replace: true,
        state: {
          success: 'Doctor account created successfully and is now available in the live directory.'
        }
      });
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout
      contextPills={[
        { label: 'Direct onboarding' },
        { label: 'Live directory update', subtle: true }
      ]}
      pageSubtitle="Create a verified doctor account directly from the admin panel."
      pageTitle="Add Doctor"
      status={{
        label: 'System pulse',
        title: 'Create verified doctor accounts',
        description: 'New providers go live immediately and baseline availability is created automatically.'
      }}
    >
      <ErrorAlert message={error} />

      <section className="dual-grid">
        <section className="section-card glass-surface">
          <div className="section-head">
            <div>
              <span className="eyebrow">Direct onboarding</span>
              <h3>Create verified doctor</h3>
            </div>
          </div>

          <form className="auth-form-stack" onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-lg-6">
                <label className="auth-label">Full name</label>
                <input className="form-control" placeholder="Doctor full name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="col-lg-6">
                <label className="auth-label">Email</label>
                <input className="form-control" placeholder="doctor@medicore.in" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="col-lg-6">
                <label className="auth-label">Specialization</label>
                <input className="form-control" placeholder="Cardiology, Neurology, Pediatrics" value={form.specialization} onChange={(event) => setForm((current) => ({ ...current, specialization: event.target.value }))} />
              </div>
              <div className="col-lg-6">
                <label className="auth-label">License number</label>
                <input className="form-control" placeholder="Medical license number" value={form.license} onChange={(event) => setForm((current) => ({ ...current, license: event.target.value }))} />
              </div>
              <div className="col-lg-4">
                <label className="auth-label">Experience</label>
                <input className="form-control" max="60" min="1" type="number" value={form.experienceYears} onChange={(event) => setForm((current) => ({ ...current, experienceYears: event.target.value }))} />
              </div>
              <div className="col-lg-4">
                <label className="auth-label">City</label>
                <input className="form-control" placeholder="Ahmedabad" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
              </div>
              <div className="col-lg-4">
                <label className="auth-label">Consultation fee</label>
                <input className="form-control" max="5000" min="100" step="50" type="number" value={form.consultationFee} onChange={(event) => setForm((current) => ({ ...current, consultationFee: event.target.value }))} />
              </div>
              <div className="col-12">
                <label className="auth-label">Hospital name</label>
                <input className="form-control" placeholder="Clinic or hospital name" value={form.hospitalName} onChange={(event) => setForm((current) => ({ ...current, hospitalName: event.target.value }))} />
              </div>
              <div className="col-lg-6">
                <label className="auth-label">Password</label>
                <input className="form-control" placeholder="Create password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
              </div>
              <div className="col-lg-6">
                <label className="auth-label">Confirm password</label>
                <input className="form-control" placeholder="Confirm password" type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
              </div>
            </div>

            <div className="d-flex gap-3 flex-wrap mt-4">
              <button className="btn-brand" disabled={submitting} type="submit">
                {submitting ? 'Creating doctor...' : 'Create verified doctor'}
              </button>
              <Link className="btn-brand-outline" to="/admin/users">
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <section className="section-card glass-surface">
          <div className="section-head">
            <div>
              <span className="eyebrow">What happens next</span>
              <h3>Admin-created doctor setup</h3>
            </div>
          </div>

          <div className="timeline-list">
            <article className="timeline-item">
              <div className="timeline-slot">01</div>
              <div className="timeline-copy">
                <strong>Doctor account is verified instantly</strong>
                <span>The provider goes live without waiting in the verification queue.</span>
              </div>
              <span className="status-tag">Live</span>
            </article>
            <article className="timeline-item">
              <div className="timeline-slot">02</div>
              <div className="timeline-copy">
                <strong>Availability slots are created</strong>
                <span>Baseline consultation slots are added automatically for the new profile.</span>
              </div>
              <span className="status-tag">Schedule</span>
            </article>
            <article className="timeline-item">
              <div className="timeline-slot">03</div>
              <div className="timeline-copy">
                <strong>User management updates immediately</strong>
                <span>The doctor appears in the admin user list and patient directory after save.</span>
              </div>
              <span className="status-tag">Ready</span>
            </article>
          </div>

          <div className="summary-list mt-4">
            <div className="summary-row">
              <span>Recommended fee range</span>
              <strong>INR 500 - INR 1500</strong>
            </div>
            <div className="summary-row">
              <span>Password policy</span>
              <strong>Strong password required</strong>
            </div>
            <div className="summary-row">
              <span>Default language set</span>
              <strong>English, Hindi</strong>
            </div>
          </div>
        </section>
      </section>
    </AdminLayout>
  );
}

export function AdminReportsPage() {
  const { data, loading, error } = useApiQuery(() => getAdminReports(), []);

  return (
    <AdminLayout
      contextPills={[
        { label: data?.metrics?.revenueTrendLabel || '0% trend' },
        { label: `${padCount(data?.metrics?.newRegistrations)} new registrations`, subtle: true }
      ]}
      pageSubtitle="Review usage and platform activity derived from the connected patient, doctor, and admin workflows."
      pageTitle="Reports"
      status={{
        label: 'System pulse',
        title: data?.metrics?.revenueLabel || 'INR 0 tracked revenue',
        description: `${data?.metrics?.approvalRateLabel || '0%'} approval rate and ${padCount(data?.metrics?.weeklyAppointments)} weekly appointments are in scope.`
      }}
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Weekly appointments</span>
              <strong>{padCount(data.metrics.weeklyAppointments)}</strong>
              <span className="soft-text">Bookings recorded in the current activity window.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">New registrations</span>
              <strong>{padCount(data.metrics.newRegistrations)}</strong>
              <span className="soft-text">Combined patient and doctor signups.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Approval rate</span>
              <strong>{data.metrics.approvalRateLabel}</strong>
              <span className="soft-text">Doctor verification conversion rate.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Revenue trend</span>
              <strong>{data.metrics.revenueTrendLabel}</strong>
              <span className="soft-text">Change versus the previous month.</span>
            </article>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Appointments</span>
                  <h3>Status breakdown</h3>
                </div>
              </div>

              <div className="summary-list">
                {data.appointmentStatusBreakdown.length > 0 ? (
                  data.appointmentStatusBreakdown.map((item) => (
                    <div key={item.label} className="summary-row">
                      <span>
                        <strong>{item.label}</strong>
                        <small className="d-block">{item.detail}</small>
                      </span>
                      <strong>{item.valueLabel}</strong>
                    </div>
                  ))
                ) : (
                  <div className="summary-row">
                    <span>No appointment data available.</span>
                    <strong>00</strong>
                  </div>
                )}
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Doctor requests</span>
                  <h3>Approval pipeline</h3>
                </div>
              </div>

              <div className="summary-list">
                {data.requestStatusBreakdown.length > 0 ? (
                  data.requestStatusBreakdown.map((item) => (
                    <div key={item.label} className="summary-row">
                      <span>
                        <strong>{item.label}</strong>
                        <small className="d-block">{item.detail}</small>
                      </span>
                      <strong>{item.valueLabel}</strong>
                    </div>
                  ))
                ) : (
                  <div className="summary-row">
                    <span>No doctor request data available.</span>
                    <strong>00</strong>
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Payments</span>
                  <h3>Payment method mix</h3>
                </div>
              </div>

              <div className="summary-list">
                {data.paymentMethodBreakdown.length > 0 ? (
                  data.paymentMethodBreakdown.map((item) => (
                    <div key={item.label} className="summary-row">
                      <span>
                        <strong>{item.label}</strong>
                        <small className="d-block">{item.detail}</small>
                      </span>
                      <strong>{item.valueLabel}</strong>
                    </div>
                  ))
                ) : (
                  <div className="summary-row">
                    <span>No completed payments found yet.</span>
                    <strong>00</strong>
                  </div>
                )}
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Doctors</span>
                  <h3>Top specializations</h3>
                </div>
              </div>

              <div className="summary-list">
                {data.specializationBreakdown.length > 0 ? (
                  data.specializationBreakdown.map((item) => (
                    <div key={item.label} className="summary-row">
                      <span>
                        <strong>{item.label}</strong>
                        <small className="d-block">{item.detail}</small>
                      </span>
                      <strong>{item.valueLabel}</strong>
                    </div>
                  ))
                ) : (
                  <div className="summary-row">
                    <span>No specialization data available.</span>
                    <strong>00</strong>
                  </div>
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </AdminLayout>
  );
}
