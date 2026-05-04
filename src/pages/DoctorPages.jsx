import { Link, useSearchParams } from 'react-router-dom';
import { formatCurrency, padCount } from '../utils/formatters';
import {
  getDoctorAppointments,
  getDoctorAvailability,
  getDoctorDashboard,
  getDoctorEarnings,
  getDoctorProfile
} from '../services/doctor';
import PanelLayout from '../layouts/PanelLayout';
import { useApiQuery } from '../hooks/useApiQuery';

const DOCTOR_NAV_ITEMS = [
  { to: '/doctor/dashboard', label: 'Overview', hint: 'Clinic snapshot', index: '01' },
  { to: '/doctor/appointments', label: 'Appointments', hint: "Today's patient queue", index: '02' },
  { to: '/doctor/profile', label: 'Profile', hint: 'Manage credentials', index: '03' },
  { to: '/doctor/availability', label: 'Availability', hint: 'Open and close slots', index: '04' },
  { to: '/doctor/earnings', label: 'Earnings', hint: 'Track performance', index: '05' }
];

function DoctorLayout({ pageTitle, pageSubtitle, status, contextPills, children }) {
  return (
    <PanelLayout
      actionLink={{ to: '/doctor/appointments', label: 'Schedule' }}
      brandSubtitle="Clinical dashboard"
      brandTitle="Doctor Panel"
      contextPills={contextPills}
      navItems={DOCTOR_NAV_ITEMS}
      pageBadge="Doctor Panel"
      pageSubtitle={pageSubtitle}
      pageTitle={pageTitle}
      roleBadge="Doctor workspace"
      roleDescription="Appointments, availability, and earnings now use a tighter clinical navigation flow."
      status={status}
      theme="panel-doctor"
      userRoleLabel="Doctor account"
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

function LoadingCard() {
  return (
    <section className="section-card glass-surface">
      <p className="mb-0">Loading...</p>
    </section>
  );
}

export function DoctorDashboardPage() {
  const { data, loading, error } = useApiQuery(() => getDoctorDashboard(), []);

  return (
    <DoctorLayout
      contextPills={[
        { label: `${padCount(data?.upcomingAppointmentsCount)} active bookings` },
        { label: data?.monthlyEarningsLabel || 'INR 0 this month', subtle: true }
      ]}
      pageSubtitle="Monitor live bookings, patient volume, pending actions, and earnings from one doctor dashboard."
      pageTitle="Doctor Overview"
      status={{
        label: 'Clinical lane',
        title: `${padCount(data?.todaysAppointmentsCount)} appointments scheduled today`,
        description: `${data?.monthlyEarningsLabel || 'INR 0'} earned this month and ${padCount(data?.pendingActionsCount)} bookings are waiting for payment.`
      }}
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="panel-hero glass-surface tilt-card">
            <span className="eyebrow">Doctor summary</span>
            <h2>Welcome back, {data.doctor.fullName}.</h2>
            <p className="soft-text mb-0">Patient bookings, next clinic slots, payment follow-ups, and earnings now sit together inside one sharper doctor workspace.</p>
          </section>

          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Today's appointments</span>
              <strong>{padCount(data.todaysAppointmentsCount)}</strong>
              <span className="soft-text">Schedule count for the current day.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Total patients</span>
              <strong>{padCount(data.totalPatientsCount)}</strong>
              <span className="soft-text">Distinct patients linked to this doctor.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Pending actions</span>
              <strong>{padCount(data.pendingActionsCount)}</strong>
              <span className="soft-text">{data.pendingRevenueLabel} still depends on payment completion.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Monthly earnings</span>
              <strong>{data.monthlyEarningsLabel}</strong>
              <span className="soft-text">Paid consultations in the current month.</span>
            </article>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Appointment queue</span>
                  <h3>Upcoming appointments</h3>
                </div>
                <Link className="btn-surface" to="/doctor/appointments">
                  Full schedule
                </Link>
              </div>

              <div className="summary-list mb-4">
                <div className="summary-row">
                  <span>Upcoming bookings</span>
                  <strong>{padCount(data.upcomingAppointmentsCount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Completed visits</span>
                  <strong>{padCount(data.completedAppointmentsCount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Pending patient payments</span>
                  <strong>{padCount(data.pendingActionsCount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Next availability</span>
                  <strong>{data.nextAvailabilityLabel}</strong>
                </div>
              </div>

              <div className="timeline-list">
                {data.upcomingAppointments.length > 0 ? (
                  data.upcomingAppointments.map((appointment) => (
                    <article key={appointment.id} className="timeline-item">
                      <div className="timeline-slot">{appointment.timeSlot}</div>
                      <div className="timeline-copy">
                        <strong>{appointment.patientName}</strong>
                        <span>{appointment.dateLabel}</span>
                        <small className="soft-text d-block">
                          {appointment.paymentStatus} payment, {appointment.feeLabel}
                        </small>
                      </div>
                      <span className="status-tag">{appointment.status}</span>
                    </article>
                  ))
                ) : (
                  <article className="timeline-item">
                    <div className="timeline-copy">
                      <strong>No upcoming appointments are scheduled right now.</strong>
                      <span>New patient bookings will appear here as soon as they are created.</span>
                    </div>
                    <span className="status-tag">Clear</span>
                  </article>
                )}
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Clinical actions</span>
                  <h3>Doctor workspace</h3>
                </div>
              </div>

              <div className="d-grid gap-3 mb-4">
                <Link className="btn-brand" to="/doctor/appointments">
                  Review appointments
                </Link>
                <Link className="btn-brand-outline" to="/doctor/appointments?paymentFilter=Pending">
                  Open pending payments
                </Link>
                <Link className="btn-brand-outline" to="/doctor/availability">
                  View availability
                </Link>
                <Link className="btn-brand-outline" to="/doctor/profile">
                  Open profile
                </Link>
              </div>

              <div className="timeline-list mb-4">
                {data.todayAppointments.length > 0 ? (
                  data.todayAppointments.map((appointment) => (
                    <article key={appointment.id} className="timeline-item">
                      <div className="timeline-slot">Today</div>
                      <div className="timeline-copy">
                        <strong>{appointment.patientName}</strong>
                        <span>{appointment.timeSlot}</span>
                        <small className="soft-text d-block">Created {appointment.createdAtLabel}</small>
                      </div>
                      <span className="status-tag">{appointment.status}</span>
                    </article>
                  ))
                ) : (
                  <article className="timeline-item">
                    <div className="timeline-copy">
                      <strong>No patients in today's queue.</strong>
                      <span>Today's consultation list is currently clear.</span>
                    </div>
                    <span className="status-tag">Open</span>
                  </article>
                )}
              </div>

              <div className="detail-card">
                <strong>Pending payment follow-up</strong>
                {data.pendingPaymentAppointments.length > 0 ? (
                  <>
                    <span className="soft-text">These bookings are still waiting for patient payment completion.</span>
                    <div className="summary-list mt-3">
                      {data.pendingPaymentAppointments.map((appointment) => (
                        <div key={appointment.id} className="summary-row">
                          <span>
                            <strong>{appointment.patientName}</strong>
                            <small className="d-block">
                              {appointment.dateLabel}, {appointment.timeSlot}
                            </small>
                          </span>
                          <strong>{appointment.feeLabel}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="soft-text">No pending patient payments are blocking the doctor queue right now.</span>
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </DoctorLayout>
  );
}

export function DoctorAppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('searchTerm') || '';
  const statusFilter = searchParams.get('statusFilter') || 'All';
  const paymentFilter = searchParams.get('paymentFilter') || 'All';
  const { data, loading, error } = useApiQuery(() => getDoctorAppointments({ searchTerm, statusFilter, paymentFilter }), [searchTerm, statusFilter, paymentFilter]);

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
    <DoctorLayout
      contextPills={[
        { label: `${padCount(data?.totalAppointmentsCount)} visible bookings` },
        { label: data?.revenueLabel || 'INR 0', subtle: true }
      ]}
      pageSubtitle="Review confirmed, pending-payment, and completed consultations from the doctor schedule table."
      pageTitle="Appointments"
      status={{
        label: 'Clinical lane',
        title: `${padCount(data?.totalAppointmentsCount)} visible bookings`,
        description: `${data?.revenueLabel || 'INR 0'} realized revenue and ${padCount(data?.pendingAppointmentsCount)} bookings still await payment.`
      }}
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Visible bookings</span>
              <strong>{padCount(data.totalAppointmentsCount)}</strong>
              <span className="soft-text">Rows matched by your current search and filters.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Confirmed</span>
              <strong>{padCount(data.confirmedAppointmentsCount)}</strong>
              <span className="soft-text">Appointments already confirmed after payment.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Completed</span>
              <strong>{padCount(data.completedAppointmentsCount)}</strong>
              <span className="soft-text">Consultations already completed.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Realized revenue</span>
              <strong>{data.revenueLabel}</strong>
              <span className="soft-text">{padCount(data.pendingAppointmentsCount)} bookings still await payment.</span>
            </article>
          </section>

          <section className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Schedule</span>
                <h3>Appointment queue</h3>
              </div>
              <Link className="btn-brand-outline" to="/doctor/earnings">
                Review earnings
              </Link>
            </div>

            <form className="row g-3 align-items-end mb-4" onSubmit={handleSubmit}>
              <div className="col-lg-5">
                <label className="auth-label">Search</label>
                <input className="form-control" defaultValue={searchTerm} name="searchTerm" placeholder="Patient, date, time, status, payment" />
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
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Fee</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.appointments.length > 0 ? (
                    data.appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{appointment.patientName}</td>
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
                        <td>
                          {appointment.canContinuePayment ? (
                            <span className="soft-text">Waiting for patient payment</span>
                          ) : appointment.status === 'Completed' ? (
                            <span className="soft-text">Visit closed</span>
                          ) : (
                            <span className="soft-text">Schedule ready</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="text-center py-4" colSpan="7">
                        No appointments matched the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </DoctorLayout>
  );
}

export function DoctorAvailabilityPage() {
  const { data, loading, error } = useApiQuery(() => getDoctorAvailability(), []);

  return (
    <DoctorLayout
      contextPills={[
        { label: data?.nextAvailabilityLabel || 'No schedule saved' },
        { label: `${padCount(data?.totalVisibleSlotsCount)} visible slots`, subtle: true }
      ]}
      pageSubtitle="Current consultation timings are shared here for the booking flow used by patients."
      pageTitle="Availability"
      status={{
        label: 'Clinical lane',
        title: `${padCount(data?.totalSlotGroupsCount)} saved schedule blocks`,
        description: `${padCount(data?.totalVisibleSlotsCount)} visible slots across ${padCount(data?.activeDaysCount)} active days.`
      }}
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Saved blocks</span>
              <strong>{padCount(data.totalSlotGroupsCount)}</strong>
              <span className="soft-text">Consultation sessions stored for this doctor.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Visible slots</span>
              <strong>{padCount(data.totalVisibleSlotsCount)}</strong>
              <span className="soft-text">Actual patient-facing time slots in the booking flow.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Active days</span>
              <strong>{padCount(data.activeDaysCount)}</strong>
              <span className="soft-text">Distinct days currently visible in the booking flow.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Next availability</span>
              <strong>{data.nextAvailabilityLabel}</strong>
              <span className="soft-text">First saved slot shown from the current doctor schedule.</span>
            </article>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Availability</span>
                  <h3>Schedule overview</h3>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-card">
                  <strong>Live booking sync</strong>
                  <span className="soft-text">The appointment slots shown to patients are served from this doctor availability setup.</span>
                </div>
                <div className="detail-card">
                  <strong>Current mode</strong>
                  <span className="soft-text">The schedule remains read-only in demo mode, but it is fully connected to patient bookings.</span>
                </div>
              </div>

              <div className="summary-list mt-4">
                {data.dayBreakdown.length > 0 ? (
                  data.dayBreakdown.map((item) => (
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
                    <span>No availability blocks saved.</span>
                    <strong>00</strong>
                  </div>
                )}
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Current schedule</span>
                  <h3>Saved timing</h3>
                </div>
              </div>

              <div className="timeline-list">
                {data.slots.length > 0 ? (
                  data.slots.map((slot) => (
                    <article key={`${slot.dayLabel}-${slot.sessionLabel}`} className="timeline-item">
                      <div className="timeline-slot">{slot.dayLabel}</div>
                      <div className="timeline-copy">
                        <strong>{slot.sessionLabel}</strong>
                        <span>{slot.timeRange}</span>
                        <small className="soft-text d-block">Slots: {slot.slotValues.join(', ')}</small>
                      </div>
                      <span className="status-tag">Active</span>
                    </article>
                  ))
                ) : (
                  <article className="timeline-item">
                    <div className="timeline-copy">
                      <strong>No schedule is available yet.</strong>
                      <span>Saved consultation sessions will appear here when availability is configured.</span>
                    </div>
                    <span className="status-tag">Empty</span>
                  </article>
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </DoctorLayout>
  );
}

export function DoctorEarningsPage() {
  const { data, loading, error } = useApiQuery(() => getDoctorEarnings(), []);

  return (
    <DoctorLayout
      contextPills={[
        { label: data?.revenueTrendLabel || '0% trend' },
        { label: data?.thisMonthLabel || 'INR 0', subtle: true }
      ]}
      pageSubtitle="Review earnings totals derived from paid appointments in the shared booking flow."
      pageTitle="Earnings"
      status={{
        label: 'Clinical lane',
        title: data?.totalEarningsLabel || 'INR 0',
        description: `${padCount(data?.paidAppointmentsCount)} paid appointments and ${padCount(data?.pendingPaymentCount)} bookings waiting for payment.`
      }}
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Total earnings</span>
              <strong>{data.totalEarningsLabel}</strong>
              <span className="soft-text">Combined earnings across paid appointments.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">This month</span>
              <strong>{data.thisMonthLabel}</strong>
              <span className="soft-text">Current month revenue snapshot.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Average per visit</span>
              <strong>{data.averagePerVisitLabel}</strong>
              <span className="soft-text">Average realized fee across paid visits.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Pending payout</span>
              <strong>{data.pendingPayoutLabel}</strong>
              <span className="soft-text">{padCount(data.pendingPaymentCount)} bookings waiting on payment completion.</span>
            </article>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Revenue</span>
                  <h3>Earnings overview</h3>
                </div>
              </div>

              <div className="summary-list">
                <div className="summary-row">
                  <span>Paid appointments</span>
                  <strong>{padCount(data.paidAppointmentsCount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Payment pending appointments</span>
                  <strong>{padCount(data.pendingPaymentCount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Month-over-month trend</span>
                  <strong>{data.revenueTrendLabel}</strong>
                </div>
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Payment methods</span>
                  <h3>Collected payment mix</h3>
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
                    <span>No paid appointment data available.</span>
                    <strong>00</strong>
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Appointment states</span>
                <h3>Booking status value</h3>
              </div>
            </div>

            <div className="summary-list">
              {data.statusBreakdown.length > 0 ? (
                data.statusBreakdown.map((item) => (
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
                  <span>No appointment status data available.</span>
                  <strong>00</strong>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </DoctorLayout>
  );
}

export function DoctorProfilePage() {
  const { data, loading, error } = useApiQuery(() => getDoctorProfile(), []);

  return (
    <DoctorLayout
      contextPills={[
        { label: data?.doctor?.specialization || 'Doctor profile' },
        { label: data?.totalEarningsLabel || 'INR 0', subtle: true }
      ]}
      pageSubtitle="Review doctor information, professional details, and live directory identity."
      pageTitle="Profile"
      status={{
        label: 'Clinical lane',
        title: `${padCount(data?.upcomingAppointmentsCount)} upcoming appointments`,
        description: `${data?.totalEarningsLabel || 'INR 0'} lifetime earnings and ${padCount(data?.totalAvailabilityBlocks)} availability blocks are active.`
      }}
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="profile-shell glass-surface tilt-card">
            <img alt={data.doctor.fullName} className="avatar-xl" src={data.doctor.avatarPath} />
            <div>
              <span className="eyebrow">Doctor account</span>
              <h2 className="mt-3 mb-1">{data.doctor.fullName}</h2>
              <p className="mb-2">{data.doctor.specialization}</p>
              <span className="status-tag">Profile active</span>
            </div>
          </section>

          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Appointments</span>
              <strong>{padCount(data.totalAppointmentsCount)}</strong>
              <span className="soft-text">Total bookings linked to this doctor account.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Upcoming</span>
              <strong>{padCount(data.upcomingAppointmentsCount)}</strong>
              <span className="soft-text">Future consultations still on the schedule.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Distinct patients</span>
              <strong>{padCount(data.distinctPatientsCount)}</strong>
              <span className="soft-text">Unique patients already served from this profile.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Lifetime earnings</span>
              <strong>{data.totalEarningsLabel}</strong>
              <span className="soft-text">Paid consultation total tied to this doctor.</span>
            </article>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Professional details</span>
                  <h3>Directory information</h3>
                </div>
              </div>

              <div className="detail-grid">
                <article className="detail-card">
                  <strong>Email</strong>
                  <span className="soft-text">{data.doctor.email}</span>
                </article>
                <article className="detail-card">
                  <strong>Experience</strong>
                  <span className="soft-text">{data.doctor.experienceYears} years</span>
                </article>
                <article className="detail-card">
                  <strong>Hospital</strong>
                  <span className="soft-text">{data.doctor.hospitalName}</span>
                </article>
                <article className="detail-card">
                  <strong>Specialization</strong>
                  <span className="soft-text">{data.doctor.specialization}</span>
                </article>
                <article className="detail-card">
                  <strong>Location</strong>
                  <span className="soft-text">{data.doctor.city}</span>
                </article>
                <article className="detail-card">
                  <strong>Languages</strong>
                  <span className="soft-text">{data.doctor.languages}</span>
                </article>
                <article className="detail-card">
                  <strong>Consultation fee</strong>
                  <span className="soft-text">{formatCurrency(data.doctor.consultationFee)}</span>
                </article>
                <article className="detail-card">
                  <strong>License number</strong>
                  <span className="soft-text">{data.doctor.licenseNumber}</span>
                </article>
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Profile management</span>
                  <h3>Live directory identity</h3>
                </div>
              </div>

              <div className="summary-list">
                <div className="summary-row">
                  <span>Directory visibility</span>
                  <strong>Visible to patients</strong>
                </div>
                <div className="summary-row">
                  <span>Availability blocks</span>
                  <strong>{padCount(data.totalAvailabilityBlocks)} active blocks</strong>
                </div>
                <div className="summary-row">
                  <span>Profile rating</span>
                  <strong>{data.doctor.rating.toFixed(1)} / 5</strong>
                </div>
                <div className="summary-row">
                  <span>Next schedule preview</span>
                  <strong>{data.availabilityPreview[0]?.dayLabel || 'Not set'}</strong>
                </div>
              </div>

              <div className="detail-card mt-4">
                <strong>Bio</strong>
                <span className="soft-text">{data.doctor.bio}</span>
              </div>

              <div className="timeline-list mt-4">
                {data.availabilityPreview.length > 0 ? (
                  data.availabilityPreview.map((slot) => (
                    <article key={`${slot.dayLabel}-${slot.sessionLabel}`} className="timeline-item">
                      <div className="timeline-slot">{slot.dayLabel}</div>
                      <div className="timeline-copy">
                        <strong>{slot.sessionLabel}</strong>
                        <span>{slot.timeRange}</span>
                        <small className="soft-text d-block">Slots: {slot.slotValues.join(', ')}</small>
                      </div>
                      <span className="status-tag">Live</span>
                    </article>
                  ))
                ) : (
                  <article className="timeline-item">
                    <div className="timeline-copy">
                      <strong>No schedule preview available.</strong>
                      <span>Availability details will appear here when session data exists.</span>
                    </div>
                    <span className="status-tag">Empty</span>
                  </article>
                )}
              </div>
            </article>
          </section>

          <section className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Recent activity</span>
                <h3>Latest patient bookings</h3>
              </div>
              <Link className="btn-surface" to="/doctor/appointments">
                Open full schedule
              </Link>
            </div>

            <div className="timeline-list">
              {data.recentAppointments.length > 0 ? (
                data.recentAppointments.map((appointment) => (
                  <article key={appointment.id} className="timeline-item">
                    <div className="timeline-slot">{appointment.timeSlot}</div>
                    <div className="timeline-copy">
                      <strong>{appointment.patientName}</strong>
                      <span>{appointment.dateLabel}</span>
                      <small className="soft-text d-block">
                        {appointment.paymentStatus} payment, created {appointment.createdAtLabel}
                      </small>
                    </div>
                    <span className="status-tag">{appointment.status}</span>
                  </article>
                ))
              ) : (
                <article className="timeline-item">
                  <div className="timeline-copy">
                    <strong>No recent appointments.</strong>
                    <span>New patient bookings will appear here automatically.</span>
                  </div>
                  <span className="status-tag">Clear</span>
                </article>
              )}
            </div>
          </section>
        </>
      )}
    </DoctorLayout>
  );
}
