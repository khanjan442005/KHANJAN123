import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formatCurrency, formatDateLabel, padCount } from '../utils/formatters';
import { completeAppointmentPayment, createAppointment } from '../services/appointments';
import { getErrorMessage } from '../services/http';
import {
  findDoctors,
  getBookingConfirmation,
  getBookingPage,
  getPatientAppointmentHistory,
  getPatientDashboard,
  getPatientDoctorProfile,
  getPatientNotifications,
  getPatientProfile,
  getPaymentPage
} from '../services/patient';
import PanelLayout from '../layouts/PanelLayout';
import { useApiQuery } from '../hooks/useApiQuery';

const PATIENT_NAV_ITEMS = [
  { to: '/patient/dashboard', label: 'Overview', hint: 'Daily care snapshot', index: '01' },
  { to: '/patient/find-doctor', label: 'Find Doctors', hint: 'Search specialists', index: '02' },
  { to: '/patient/appointments', label: 'Visits', hint: 'Track bookings and payments', index: '03' },
  { to: '/patient/appointments', label: 'History', hint: 'Review previous visits', index: '04' },
  { to: '/patient/notifications', label: 'Notifications', hint: 'Track alerts and updates', index: '05' },
  { to: '/patient/profile', label: 'Profile', hint: 'Manage personal details', index: '06' }
];

function PatientLayout({ pageTitle, pageSubtitle, children }) {
  return (
    <PanelLayout
      actionLink={{ to: '/patient/notifications', label: 'Alerts' }}
      brandSubtitle="Care dashboard"
      brandTitle="Patient Panel"
      contextPills={[
        { label: 'New navigation system' },
        { label: 'Patient dashboard', subtle: true }
      ]}
      navItems={PATIENT_NAV_ITEMS}
      pageBadge="Patient Panel"
      pageSubtitle={pageSubtitle}
      pageTitle={pageTitle}
      roleBadge="Patient workspace"
      roleDescription="Doctors, bookings, and updates now stay inside one cleaner navigation flow."
      status={{
        label: 'Health sync',
        title: 'Care activity ready',
        description: 'Appointments, payments, and notifications stay grouped in one clear view.'
      }}
      theme="panel-patient"
      userRoleLabel="Patient account"
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

function getDayLabel(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

export function PatientDashboardPage() {
  const { data, loading, error } = useApiQuery(() => getPatientDashboard(), []);

  return (
    <PatientLayout
      pageSubtitle="Track live appointments, doctor availability, and payment updates from one patient dashboard."
      pageTitle="Patient Overview"
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="panel-hero glass-surface tilt-card">
            <span className="eyebrow">Patient summary</span>
            <h2>Welcome back, {data.patient.fullName.split(' ')[0]}.</h2>
            <p className="soft-text mb-0">Booking, payment, and confirmation status have been connected with doctor and admin workflows.</p>
          </section>

          <section className="stats-grid">
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Upcoming appointments</span>
              <strong>{padCount(data.upcomingAppointmentsCount)}</strong>
              <span className="soft-text">Live appointments across booking and payment flow.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Total visits</span>
              <strong>{padCount(data.totalVisitsCount)}</strong>
              <span className="soft-text">Completed and upcoming visits tracked together.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Verified doctors</span>
              <strong>{padCount(data.savedDoctorsCount)}</strong>
              <span className="soft-text">Directory updates after admin approval.</span>
            </article>
            <article className="stat-card glass-surface tilt-card">
              <span className="soft-text">Pending payments</span>
              <strong>{padCount(data.pendingPaymentsCount)}</strong>
              <span className="soft-text">Appointments waiting for payment confirmation.</span>
            </article>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Upcoming visits</span>
                  <h3>Upcoming care timeline</h3>
                </div>
                <Link className="btn-surface" to="/patient/appointments">
                  See history
                </Link>
              </div>

              <div className="timeline-list">
                {data.upcomingAppointments.length > 0 ? (
                  data.upcomingAppointments.map((appointment) => (
                    <article key={appointment.id} className="timeline-item">
                      <div className="timeline-slot">{appointment.timeSlot}</div>
                      <div className="timeline-copy">
                        <strong>{appointment.doctorName}</strong>
                        <span>
                          {appointment.doctorSpecialization} on {appointment.dateLabel}
                        </span>
                        {appointment.canContinuePayment ? (
                          <small className="soft-text d-block">Payment is still pending for this booking.</small>
                        ) : null}
                      </div>
                      <div className="d-flex flex-column align-items-end gap-2">
                        <span className="status-tag">{appointment.status}</span>
                        {appointment.canContinuePayment ? (
                          <Link className="btn-surface" to={`/patient/payment/${appointment.id}`}>
                            Pay now
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <article className="timeline-item">
                    <div className="timeline-slot">NA</div>
                    <div className="timeline-copy">
                      <strong>No upcoming visit</strong>
                      <span>Find a verified doctor and create a new booking.</span>
                    </div>
                    <span className="status-tag">Ready</span>
                  </article>
                )}
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Quick actions</span>
                  <h3>Quick actions</h3>
                </div>
              </div>

              <div className="d-grid gap-3">
                <Link className="btn-brand" to="/patient/find-doctor">
                  Find a doctor
                </Link>
                <Link className="btn-brand-outline" to={data.featuredDoctors[0] ? `/patient/book/${data.featuredDoctors[0].id}` : '/patient/find-doctor'}>
                  Book appointment
                </Link>
                <Link className="btn-brand-outline" to="/patient/appointments">
                  Review payments
                </Link>
              </div>

              <div className="timeline-list mt-4">
                {data.recentNotifications.length > 0 ? (
                  data.recentNotifications.map((notification) => (
                    <article key={`${notification.indexLabel}-${notification.title}`} className="timeline-item">
                      <div className="timeline-copy">
                        <strong>{notification.title}</strong>
                        <span>{notification.message}</span>
                        <small className="soft-text d-block">{notification.timeLabel}</small>
                      </div>
                      <span className="status-tag">{notification.label}</span>
                    </article>
                  ))
                ) : (
                  <article className="timeline-item">
                    <div className="timeline-copy">
                      <strong>No recent alerts</strong>
                      <span>Important payment and booking updates will appear here.</span>
                    </div>
                    <span className="status-tag">Clear</span>
                  </article>
                )}
              </div>
            </article>
          </section>

          <section className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Featured doctors</span>
                <h3>Verified specialists</h3>
              </div>
              <Link className="btn-surface" to="/patient/find-doctor">
                Open directory
              </Link>
            </div>

            <div className="doctor-grid">
              {data.featuredDoctors.length > 0 ? (
                data.featuredDoctors.map((doctor) => (
                  <Link key={doctor.id} className="doctor-tile glass-surface tilt-card" to={`/patient/doctors/${doctor.id}`}>
                    <strong>{doctor.fullName}</strong>
                    <span className="doctor-meta">
                      {doctor.specialization}, {doctor.city}
                    </span>
                    <p className="mb-0">
                      {doctor.rating.toFixed(1)} rating, {doctor.experienceYears}+ years experience, {formatCurrency(doctor.consultationFee)} consultation.
                    </p>
                  </Link>
                ))
              ) : (
                <article className="detail-card">
                  <strong>No verified doctors available.</strong>
                  <span className="soft-text">Approved doctors will appear here automatically.</span>
                </article>
              )}
            </div>
          </section>
        </>
      )}
    </PatientLayout>
  );
}

export function PatientFindDoctorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('searchTerm') || '';
  const specialization = searchParams.get('specialization') || '';
  const { data, loading, error } = useApiQuery(() => findDoctors({ searchTerm, specialization }), [searchTerm, specialization]);

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextParams = new URLSearchParams();
    const nextSearchTerm = String(formData.get('searchTerm') || '').trim();
    const nextSpecialization = String(formData.get('specialization') || '').trim();

    if (nextSearchTerm) {
      nextParams.set('searchTerm', nextSearchTerm);
    }

    if (nextSpecialization) {
      nextParams.set('specialization', nextSpecialization);
    }

    setSearchParams(nextParams);
  }

  return (
    <PatientLayout
      pageSubtitle="Browse verified specialists. Newly approved doctors will appear here automatically after admin approval."
      pageTitle="Find Doctors"
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="panel-hero glass-surface tilt-card">
            <span className="eyebrow">Doctor directory</span>
            <h2>Find the right specialist for your next visit.</h2>
            <p className="soft-text mb-0">
              {data.verifiedDoctorsCount} verified doctors are currently available. {data.pendingReviewCount} registration request(s) are still pending admin review.
            </p>
          </section>

          <section className="section-card glass-surface mb-4">
            <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
              <div className="col-lg-5">
                <label className="auth-label">Search doctor</label>
                <input className="form-control" defaultValue={searchTerm} name="searchTerm" placeholder="Name, specialization, hospital, city" />
              </div>
              <div className="col-lg-4">
                <label className="auth-label">Specialization</label>
                <select className="form-select" defaultValue={specialization} name="specialization">
                  <option value="">All specializations</option>
                  {data.specializations.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-lg-3 d-grid">
                <button className="btn-brand" type="submit">
                  Apply filters
                </button>
              </div>
            </form>
          </section>

          <section className="doctor-grid">
            {data.doctors.length > 0 ? (
              data.doctors.map((doctor) => (
                <article key={doctor.id} className="doctor-tile glass-surface tilt-card">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <img alt={doctor.fullName} className="avatar-lg" src={doctor.avatarPath} />
                    <div>
                      <strong>{doctor.fullName}</strong>
                      <span className="doctor-meta">{doctor.specialization}</span>
                    </div>
                  </div>
                  <p className="mb-3">
                    {doctor.rating.toFixed(1)} rating, {doctor.experienceYears}+ years experience, {doctor.hospitalName}, {doctor.city}.
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    <Link className="btn-surface" to={`/patient/doctors/${doctor.id}`}>
                      View profile
                    </Link>
                    <Link className="btn-brand" to={`/patient/book/${doctor.id}`}>
                      Book appointment
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article className="section-card glass-surface">
                <strong>No doctors matched your current filters.</strong>
                <p className="soft-text mb-0">Try a broader search term or clear specialization filtering.</p>
              </article>
            )}
          </section>
        </>
      )}
    </PatientLayout>
  );
}

export function PatientDoctorProfilePage() {
  const { id } = useParams();
  const { data, loading, error } = useApiQuery(() => getPatientDoctorProfile(id), [id]);

  return (
    <PatientLayout
      pageSubtitle="Review verified doctor details, experience, and available slots before you confirm a booking."
      pageTitle="Doctor Profile"
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="profile-shell glass-surface tilt-card">
            <img alt={data.doctor.fullName} className="avatar-xl" src={data.doctor.avatarPath} />
            <div>
              <span className="eyebrow">Doctor profile</span>
              <h2 className="mt-3 mb-1">{data.doctor.fullName}</h2>
              <p className="mb-2">{data.doctor.specialization}</p>
              <span className="status-tag">{data.doctor.rating.toFixed(1)} Rating</span>
            </div>
          </section>

          <section className="dual-grid">
            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">About doctor</span>
                  <h3>Professional summary</h3>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-card">
                  <strong>Experience</strong>
                  <span className="soft-text">{data.doctor.experienceYears}+ years of clinical practice.</span>
                </div>
                <div className="detail-card">
                  <strong>Focus area</strong>
                  <span className="soft-text">{data.doctor.bio}</span>
                </div>
                <div className="detail-card">
                  <strong>Clinic</strong>
                  <span className="soft-text">
                    {data.doctor.hospitalName}, {data.doctor.city}
                  </span>
                </div>
                <div className="detail-card">
                  <strong>Languages</strong>
                  <span className="soft-text">{data.doctor.languages}</span>
                </div>
              </div>
            </article>

            <article className="section-card glass-surface">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Available slots</span>
                  <h3>Next appointment options</h3>
                </div>
              </div>

              <div className="slot-grid mb-4">
                {data.availableSlots.map((slot) => (
                  <span key={slot} className="slot-chip">
                    {slot}
                  </span>
                ))}
              </div>

              <div className="summary-list mb-4">
                <div className="summary-row">
                  <span>Consultation fee</span>
                  <strong>{formatCurrency(data.doctor.consultationFee)}</strong>
                </div>
                <div className="summary-row">
                  <span>Verification</span>
                  <strong>Admin approved</strong>
                </div>
              </div>

              <Link className="btn-brand w-100" to={`/patient/book/${data.doctor.id}`}>
                Continue to booking
              </Link>
            </article>
          </section>
        </>
      )}
    </PatientLayout>
  );
}

export function PatientBookAppointmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useApiQuery(() => getBookingPage(id), [id]);
  const [form, setForm] = useState({
    appointmentDate: '',
    timeSlot: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    setForm({
      appointmentDate: data.input?.appointmentDate || '',
      timeSlot: data.input?.timeSlot || ''
    });
  }, [data]);

  const selectedDay = getDayLabel(form.appointmentDate);
  const visibleSlotOptions = !data?.slotOptions
    ? []
    : !selectedDay
      ? data.slotOptions
      : data.slotOptions.filter((slot) => slot.availableDays.includes(selectedDay));

  useEffect(() => {
    if (!form.timeSlot) {
      return;
    }

    if (!visibleSlotOptions.some((slot) => slot.value === form.timeSlot)) {
      setForm((current) => ({ ...current, timeSlot: '' }));
    }
  }, [form.timeSlot, visibleSlotOptions]);

  let slotMessage = 'Pick a date to see which time slots are valid for that day.';
  if (form.appointmentDate && !selectedDay) {
    slotMessage = 'Choose a valid appointment date.';
  } else if (selectedDay && visibleSlotOptions.length === 0) {
    slotMessage = `No slots are available on ${selectedDay}. Choose another date from the doctor's saved schedule.`;
  } else if (selectedDay && visibleSlotOptions.length > 0) {
    slotMessage = `${visibleSlotOptions.length} slot(s) available on ${selectedDay}.`;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await createAppointment({
        doctorId: Number(id),
        appointmentDate: form.appointmentDate,
        timeSlot: form.timeSlot
      });

      const appointmentId = response.id || response.appointmentId;
      navigate(`/patient/payment/${appointmentId}`);
    } catch (submissionError) {
      setSubmitError(getErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PatientLayout
      pageSubtitle="Create a booking request. After payment, the status updates instantly for both doctor and admin views."
      pageTitle="Book Appointment"
    >
      <ErrorAlert message={error} />
      <ErrorAlert message={submitError} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <section className="dual-grid">
          <article className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Selected doctor</span>
                <h3>Doctor and schedule details</h3>
              </div>
            </div>

            <div className="profile-shell mb-4">
              <img alt={data.doctor.fullName} className="avatar-lg" src={data.doctor.avatarPath} />
              <div>
                <h4 className="mb-1">{data.doctor.fullName}</h4>
                <p className="mb-1">{data.doctor.specialization}</p>
                <span className="status-tag">{data.doctor.rating.toFixed(1)} Rating</span>
              </div>
            </div>

            <form className="auth-form-stack" onSubmit={handleSubmit}>
              <div className="detail-grid">
                <div className="detail-card">
                  <strong>Select date</strong>
                  <input className="form-control mt-3" min={data.minimumDate} type="date" value={form.appointmentDate} onChange={(event) => setForm((current) => ({ ...current, appointmentDate: event.target.value }))} />
                </div>
                <div className="detail-card">
                  <strong>Booking guidance</strong>
                  <p className="mb-0">Choose a date first. Only slots that match the doctor's saved weekly schedule stay active.</p>
                </div>
              </div>

              <div className="section-card glass-surface mt-4">
                <div className="section-head mb-3">
                  <div>
                    <span className="eyebrow">Available slots</span>
                    <h3>Select preferred time</h3>
                  </div>
                </div>

                <p className="soft-text mb-3">{slotMessage}</p>

                <div className="slot-grid">
                  {visibleSlotOptions.map((slot) => {
                    const slotId = `time-slot-${data.doctor.id}-${slot.value.replaceAll(' ', '').replaceAll(':', '').toLowerCase()}`;
                    return (
                      <label key={slot.value} className="slot-choice">
                        <input checked={form.timeSlot === slot.value} id={slotId} name="timeSlot" type="radio" value={slot.value} onChange={(event) => setForm((current) => ({ ...current, timeSlot: event.target.value }))} />
                        <span className="slot-chip">{slot.value}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 d-grid gap-3">
                <button className="btn-brand" disabled={submitting} type="submit">
                  {submitting ? 'Creating booking...' : 'Continue to payment'}
                </button>
                <Link className="btn-brand-outline" to="/patient/find-doctor">
                  Back to doctors
                </Link>
              </div>
            </form>
          </article>

          <article className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Booking summary</span>
                <h3>Charges and schedule</h3>
              </div>
            </div>

            <div className="summary-list">
              <div className="summary-row">
                <span>Doctor</span>
                <strong>{data.doctor.fullName}</strong>
              </div>
                <div className="summary-row">
                  <span>Consultation fee</span>
                  <strong>{formatCurrency(data.doctor.consultationFee)}</strong>
                </div>
                <div className="summary-row">
                  <span>Platform fee</span>
                  <strong>INR 50</strong>
                </div>
                <div className="summary-row">
                  <span>Total</span>
                  <strong>{formatCurrency(Number(data.doctor.consultationFee || 0) + 50)}</strong>
                </div>
              </div>

            <div className="timeline-list mt-4">
              {data.scheduleItems.length > 0 ? (
                data.scheduleItems.map((item) => (
                  <article key={`${item.dayLabel}-${item.sessionLabel}`} className="timeline-item">
                    <div className="timeline-slot">{item.dayLabel}</div>
                    <div className="timeline-copy">
                      <strong>{item.sessionLabel}</strong>
                      <span>{item.timeRange}</span>
                      <small className="soft-text d-block">Slots: {item.slotValues.join(', ')}</small>
                    </div>
                    <span className="status-tag">Open</span>
                  </article>
                ))
              ) : (
                <article className="timeline-item">
                  <div className="timeline-copy">
                    <strong>No schedule available right now.</strong>
                    <span>Please choose another doctor from the directory.</span>
                  </div>
                  <span className="status-tag">Unavailable</span>
                </article>
              )}
            </div>

            <div className="detail-card mt-4">
              <strong>Live sync</strong>
              <span className="soft-text">As soon as the booking is created, the payment pending status appears in both the doctor panel and admin reports.</span>
            </div>
          </article>
        </section>
      )}
    </PatientLayout>
  );
}

export function PatientPaymentPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useApiQuery(() => getPaymentPage(appointmentId), [appointmentId]);
  const [form, setForm] = useState({
    paymentMethod: 'UPI',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    setForm((current) => ({
      ...current,
      paymentMethod: data.input?.paymentMethod || 'UPI'
    }));
  }, [data]);

  let paymentNote = 'UPI payments confirm instantly and do not require extra card details.';
  if (form.paymentMethod === 'Net Banking') {
    paymentNote = 'Net banking confirms directly after the payment request is submitted.';
  } else if (form.paymentMethod === 'Cash at clinic') {
    paymentNote = 'Your booking will be confirmed now, and you can pay at the clinic during the visit.';
  } else if (form.paymentMethod === 'Card') {
    paymentNote = 'Enter your card details to confirm the appointment payment.';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await completeAppointmentPayment(appointmentId, {
        paymentMethod: form.paymentMethod,
        cardNumber: form.cardNumber,
        expiry: form.expiry,
        cvc: form.cvc
      });

      navigate(`/patient/booking-confirm/${response.appointmentId || appointmentId}`);
    } catch (submissionError) {
      setSubmitError(getErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PatientLayout
      pageSubtitle="Confirm payment and move appointment into doctor schedule and admin reports instantly."
      pageTitle="Payment"
    >
      <ErrorAlert message={error} />
      <ErrorAlert message={submitError} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <section className="dual-grid">
          <article className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Payment method</span>
                <h3>Choose how you want to pay</h3>
              </div>
            </div>

            <form className="auth-form-stack" onSubmit={handleSubmit}>
              <div className="payment-options">
                {['Card', 'UPI', 'Net Banking', 'Cash at clinic'].map((method) => (
                  <label key={method} className="payment-option">
                    <input checked={form.paymentMethod === method} name="paymentMethod" type="radio" value={method} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} />
                    <span>
                      {method}
                      <small>
                        {method === 'Card'
                          ? 'Visa, Mastercard, RuPay'
                          : method === 'UPI'
                            ? 'Google Pay, PhonePe, Paytm'
                            : method === 'Net Banking'
                              ? 'Direct bank payment'
                              : 'Pay during your visit'}
                      </small>
                    </span>
                  </label>
                ))}
              </div>

              <div className="detail-card mt-4">
                <strong>Payment note</strong>
                <span className="soft-text">{paymentNote}</span>
              </div>

              {form.paymentMethod === 'Card' ? (
                <div className="detail-grid mt-4">
                  <div className="detail-card">
                    <strong>Card number</strong>
                    <input className="form-control mt-3" placeholder="1234 5678 9012 3456" value={form.cardNumber} onChange={(event) => setForm((current) => ({ ...current, cardNumber: event.target.value }))} />
                  </div>
                  <div className="detail-card">
                    <strong>Expiry and CVC</strong>
                    <div className="row g-3 mt-1">
                      <div className="col-6">
                        <input className="form-control" placeholder="MM/YY" value={form.expiry} onChange={(event) => setForm((current) => ({ ...current, expiry: event.target.value }))} />
                      </div>
                      <div className="col-6">
                        <input className="form-control" placeholder="CVC" value={form.cvc} onChange={(event) => setForm((current) => ({ ...current, cvc: event.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 d-grid gap-3">
                <button className="btn-brand" disabled={submitting} type="submit">
                  {submitting ? 'Processing payment...' : `Pay ${formatCurrency(data.appointment.totalAmount)}`}
                </button>
                <Link className="btn-brand-outline" to={`/patient/book/${data.doctor.id}`}>
                  Back to booking
                </Link>
              </div>
            </form>
          </article>

          <article className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Summary</span>
                <h3>Booking charges</h3>
              </div>
            </div>

            <div className="summary-list">
              <div className="summary-row">
                <span>Patient</span>
                <strong>{data.patient.fullName}</strong>
              </div>
              <div className="summary-row">
                <span>Doctor</span>
                <strong>{data.doctor.fullName}</strong>
              </div>
              <div className="summary-row">
                <span>Appointment</span>
                <strong>
                  {formatDateLabel(data.appointment.appointmentDate)}, {data.appointment.timeSlot}
                </strong>
              </div>
              <div className="summary-row">
                <span>Consultation fee</span>
                <strong>{formatCurrency(data.appointment.consultationFee)}</strong>
              </div>
              <div className="summary-row">
                <span>Platform fee</span>
                <strong>{formatCurrency(data.appointment.platformFee)}</strong>
              </div>
              <div className="summary-row">
                <span>Total amount</span>
                <strong>{formatCurrency(data.appointment.totalAmount)}</strong>
              </div>
            </div>

            <div className="detail-card mt-4">
              <strong>Live sync</strong>
              <span className="soft-text">Once payment is confirmed, this booking is marked as confirmed in the doctor panel and the admin revenue and report counts are updated automatically.</span>
            </div>
          </article>
        </section>
      )}
    </PatientLayout>
  );
}

export function PatientBookingConfirmPage() {
  const { appointmentId } = useParams();
  const { data, loading, error } = useApiQuery(() => getBookingConfirmation(appointmentId), [appointmentId]);

  return (
    <PatientLayout
      pageSubtitle="Your appointment has been saved successfully and synced across the platform."
      pageTitle="Booking Confirmed"
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <section className="confirmation-shell glass-surface tilt-card">
          <div className="confirmation-mark">OK</div>
          <span className="eyebrow">Confirmation</span>
          <h2 className="mt-3">Your appointment has been confirmed.</h2>
          <p className="soft-text mb-4">
            {data.doctor.fullName} has been booked for {formatDateLabel(data.appointment.appointmentDate)} at {data.appointment.timeSlot}. The doctor schedule, patient notifications, and admin revenue metrics have all been updated.
          </p>

          <div className="detail-grid text-start">
            <div className="detail-card">
              <strong>Doctor</strong>
              <span className="soft-text">
                {data.doctor.fullName}, {data.doctor.specialization}
              </span>
            </div>
            <div className="detail-card">
              <strong>Time</strong>
              <span className="soft-text">
                {formatDateLabel(data.appointment.appointmentDate)}, {data.appointment.timeSlot}
              </span>
            </div>
            <div className="detail-card">
              <strong>Payment</strong>
              <span className="soft-text">{data.appointment.paymentMethod}</span>
            </div>
            <div className="detail-card">
              <strong>Total</strong>
              <span className="soft-text">{formatCurrency(data.appointment.totalAmount)}</span>
            </div>
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
            <Link className="btn-brand" to="/patient/appointments">
              View history
            </Link>
            <Link className="btn-brand-outline" to="/patient/dashboard">
              Back to dashboard
            </Link>
          </div>
        </section>
      )}
    </PatientLayout>
  );
}

export function PatientAppointmentHistoryPage() {
  const { data, loading, error } = useApiQuery(() => getPatientAppointmentHistory(), []);

  return (
    <PatientLayout
      pageSubtitle="Review completed, pending, and confirmed appointments from one live history table."
      pageTitle="Appointment History"
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <section className="section-card glass-surface">
          <div className="section-head">
            <div>
              <span className="eyebrow">Visit history</span>
              <h3>Appointments</h3>
            </div>
            <Link className="btn-surface" to="/patient/find-doctor">
              Book another visit
            </Link>
          </div>

          {data.appointments.length > 0 ? (
            <div className="table-theme glass-surface">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Booked on</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        <strong>{appointment.doctorName}</strong>
                        <div className="soft-text">{appointment.doctorSpecialization}</div>
                        <div className="soft-text">{appointment.timeSlot}</div>
                      </td>
                      <td>{appointment.dateLabel}</td>
                      <td>
                        <span className="status-tag">{appointment.status}</span>
                      </td>
                      <td>
                        <strong>{appointment.paymentStatus}</strong>
                        <div className="soft-text">{appointment.paymentMethod}</div>
                        <div className="soft-text">{appointment.feeLabel}</div>
                      </td>
                      <td>{appointment.createdAtLabel}</td>
                      <td>
                        {appointment.canContinuePayment ? (
                          <Link className="btn-brand-outline" to={`/patient/payment/${appointment.id}`}>
                            Resume payment
                          </Link>
                        ) : (
                          <span className="soft-text">No action needed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="detail-card">
              <strong>No appointments yet.</strong>
              <span className="soft-text">Find a verified doctor and create your first booking from the patient panel.</span>
            </div>
          )}
        </section>
      )}
    </PatientLayout>
  );
}

export function PatientNotificationsPage() {
  const { data, loading, error } = useApiQuery(() => getPatientNotifications(), []);

  return (
    <PatientLayout
      pageSubtitle="Keep track of booking, payment, and confirmation alerts generated from live role activity."
      pageTitle="Notifications"
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <section className="section-card glass-surface">
          <div className="section-head">
            <div>
              <span className="eyebrow">Alerts</span>
              <h3>Recent notifications</h3>
            </div>
          </div>

          {data.notifications.length > 0 ? (
            <div className="timeline-list">
              {data.notifications.map((notification) => (
                <article key={`${notification.indexLabel}-${notification.title}`} className="timeline-item">
                  <div className="icon-stat">{notification.indexLabel}</div>
                  <div className="timeline-copy">
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <small className="soft-text d-block">{notification.timeLabel}</small>
                  </div>
                  <span className="status-tag">{notification.label}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="detail-card">
              <strong>No new notifications.</strong>
              <span className="soft-text">Booking, payment, and reminder alerts will appear here automatically.</span>
            </div>
          )}
        </section>
      )}
    </PatientLayout>
  );
}

export function PatientProfilePage() {
  const { data, loading, error } = useApiQuery(() => getPatientProfile(), []);

  return (
    <PatientLayout
      pageSubtitle="Review patient profile details and live account activity from one organized page."
      pageTitle="Profile"
    >
      <ErrorAlert message={error} />

      {loading || !data ? (
        <LoadingCard />
      ) : (
        <>
          <section className="profile-shell glass-surface tilt-card">
            <img alt={data.patient.fullName} className="avatar-xl" src={data.patient.avatarPath} />
            <div>
              <span className="eyebrow">Patient account</span>
              <h2 className="mt-3 mb-1">{data.patient.fullName}</h2>
              <p className="mb-2">{data.patient.statusLabel}</p>
              <span className="status-tag">Profile active</span>
            </div>
          </section>

          <section className="detail-grid">
            <article className="detail-card">
              <strong>Email</strong>
              <span className="soft-text">{data.patient.email}</span>
            </article>
            <article className="detail-card">
              <strong>Phone</strong>
              <span className="soft-text">{data.patient.phone}</span>
            </article>
            <article className="detail-card">
              <strong>Address</strong>
              <span className="soft-text">{data.patient.address}</span>
            </article>
            <article className="detail-card">
              <strong>Date of birth</strong>
              <span className="soft-text">{data.patient.dateOfBirthLabel}</span>
            </article>
            <article className="detail-card">
              <strong>Active appointments</strong>
              <span className="soft-text">{padCount(data.activeAppointmentsCount)} current appointment(s)</span>
            </article>
            <article className="detail-card">
              <strong>Notifications</strong>
              <span className="soft-text">{padCount(data.notificationCount)} recent alert(s)</span>
            </article>
          </section>

          <section className="section-card glass-surface">
            <div className="section-head">
              <div>
                <span className="eyebrow">Actions</span>
                <h3>Profile management</h3>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-3">
              <Link className="btn btn-primary" to="/patient/appointments">
                View history
              </Link>
              <Link className="btn-brand-outline" to="/patient/notifications">
                View notifications
              </Link>
            </div>
          </section>
        </>
      )}
    </PatientLayout>
  );
}
