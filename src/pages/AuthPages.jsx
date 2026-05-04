import { useState } from 'react';
import { Link, Navigate, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { routeForRole } from '../utils/routes';
import { getErrorMessage } from '../services/http';
import * as authApi from '../services/auth';

const DEMO_ACCOUNTS = [
  { role: 'Patient', email: 'patient@medicore.com', password: 'patient123' },
  { role: 'Doctor', email: 'doctor@medicore.in', password: 'doctor123' },
  { role: 'Admin', email: 'admin@medicore.in', password: 'admin123' }
];

const DEMO_ADMIN_CODE = 'MEDICORE-ADMIN';

function AlertMessage({ kind, message }) {
  if (!message) {
    return null;
  }

  return <div className={`alert alert-${kind} mt-3`}>{message}</div>;
}

function SubmitButton({ children, submitting, busyText }) {
  return (
    <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
      {submitting ? busyText : children}
    </button>
  );
}

function AuthPageShell({ tag, title, subtitle, children }) {
  return (
    <AuthLayout tag={tag} title={title} subtitle={subtitle}>
      {children}
    </AuthLayout>
  );
}

function DemoCredentialsPanel({ onUse }) {
  return (
    <div className="demo-panel">
      <div className="demo-panel-head">
        <div className="demo-panel-copy">
          <strong className="demo-panel-title">Demo credentials</strong>
          <p className="demo-panel-text mb-0 mt-1">Use seeded accounts to verify patient, doctor, and admin flows quickly.</p>
        </div>
        <span className="demo-panel-badge">Local mode</span>
      </div>

      <div className="demo-account-list">
        {DEMO_ACCOUNTS.map((account) => (
          <div key={account.role} className="demo-account-card">
            <div className="demo-account-copy">
              <strong className="demo-account-role">{account.role}</strong>
              <span className="demo-account-value">
                {account.email} / {account.password}
              </span>
            </div>
            <button className="btn-surface btn-sm" type="button" onClick={() => onUse(account)}>
              Use {account.role}
            </button>
          </div>
        ))}
      </div>

      <p className="demo-panel-text mb-0 mt-4">New doctor registrations stay blocked from login until an admin approves them.</p>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signIn } = useAuth();
  const [form, setForm] = useState({
    role: 'Patient',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!session.loading && session.user) {
    return <Navigate to={routeForRole(session.user.role)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { result, user } = await signIn({
        role: form.role,
        email: form.email,
        password: form.password
      });

      navigate(result?.redirectTo || routeForRole(user?.role), { replace: true });
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      tag="Portal access"
      title="Sign in to the MediCore platform."
      subtitle="Access patient, doctor, or admin workflows through one clear login experience."
    >
      <section className="auth-form-card glass-surface tilt-card">
        <span className="eyebrow">Sign in</span>
        <h2>Enter MediCore</h2>
        <p>Select your role and continue to the relevant dashboard.</p>

        <AlertMessage kind="success" message={location.state?.success} />
        <AlertMessage kind="danger" message={error} />

        <form className="auth-form-stack" onSubmit={handleSubmit}>
          <div>
            <label className="auth-label">Role</label>
            <div className="role-pills">
              {['Patient', 'Doctor', 'Admin'].map((role) => (
                <label key={role} className="role-pill">
                  <input checked={form.role === role} name="role" type="radio" value={role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} />
                  <span>{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="auth-label">Email</label>
            <input className="form-control" placeholder="name@medicore.com" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </div>

          <div>
            <label className="auth-label">Password</label>
            <input className="form-control" placeholder="Enter password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </div>

          <div className="auth-links">
            <NavLink to="/auth/forgot-password">Forgot password?</NavLink>
            <span className="soft-text">Secure access</span>
          </div>

          <SubmitButton submitting={submitting} busyText="Signing in...">
            Login
          </SubmitButton>
        </form>

        <div className="auth-switch">
          New to MediCore? <NavLink to="/auth/register">Choose registration type</NavLink>
        </div>

        <DemoCredentialsPanel onUse={(account) => setForm(account)} />
      </section>
    </AuthPageShell>
  );
}

export function RegisterChooserPage() {
  return (
    <AuthPageShell
      tag="Role selection"
      title="Choose how you want to register."
      subtitle="Start with the role that matches how you will use the system."
    >
      <section className="auth-form-card glass-surface tilt-card">
        <span className="eyebrow">Register</span>
        <h2>Select a role</h2>
        <p>Select a role and continue to its registration form.</p>

        <div className="role-option-grid">
          <Link className="role-option glass-surface" to="/auth/register/patient">
            <strong>Patient account</strong>
            <p className="mb-0">Book appointments, manage notifications, and keep healthcare activity in one place.</p>
          </Link>

          <Link className="role-option glass-surface" to="/auth/register/doctor">
            <strong>Doctor account</strong>
            <p className="mb-0">Set availability, review appointments, and manage doctor workflows.</p>
          </Link>

          <Link className="role-option glass-surface" to="/auth/register/admin">
            <strong>Admin account</strong>
            <p className="mb-0">Manage verification, reports, and user operations across the system.</p>
          </Link>
        </div>

        <div className="auth-switch">
          Already registered? <NavLink to="/auth/login">Go to login</NavLink>
        </div>
      </section>
    </AuthPageShell>
  );
}

export function PatientRegisterPage() {
  return (
    <RegistrationPage
      tag="Patient registration"
      title="Create a patient account."
      subtitle="Register to book appointments, receive notifications, and manage your healthcare activity."
      eyebrow="Patient"
      heading="Create patient account"
      description="Set up your account to access appointments, profile updates, and visit history. New patient registrations are also reflected in the admin panel automatically."
      submitLabel="Create account"
      submitBusyLabel="Creating account..."
      loginCopy="Already have access?"
      loginLabel="Sign in"
      buildPayload={(form) => ({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword
      })}
      onSubmit={authApi.registerPatient}
      fields={[
        { key: 'name', label: 'Full name', placeholder: 'Full name' },
        { key: 'email', label: 'Email', placeholder: 'name@medicore.com', type: 'email' },
        { key: 'password', label: 'Password', placeholder: 'Create password', type: 'password' },
        { key: 'confirmPassword', label: 'Confirm password', placeholder: 'Confirm password', type: 'password' }
      ]}
    />
  );
}

export function DoctorRegisterPage() {
  return (
    <RegistrationPage
      tag="Doctor registration"
      title="Create a doctor account."
      subtitle="Register professional details to manage appointments, availability, and patient workflow."
      eyebrow="Doctor"
      heading="Create doctor account"
      description="Provide your professional details to continue. Once submitted, the admin verification queue will update automatically."
      submitLabel="Create account"
      submitBusyLabel="Creating account..."
      loginCopy="Already onboarded?"
      loginLabel="Sign in"
      buildPayload={(form) => ({
        name: form.name,
        email: form.email,
        specialization: form.specialization,
        license: form.license,
        password: form.password,
        confirmPassword: form.confirmPassword
      })}
      onSubmit={authApi.registerDoctor}
      fields={[
        { key: 'name', label: 'Full name', placeholder: 'Doctor name' },
        { key: 'email', label: 'Email', placeholder: 'doctor@medicore.in', type: 'email' },
        { key: 'specialization', label: 'Specialization', placeholder: 'Cardiology, Dental, Neurology...' },
        { key: 'license', label: 'License number', placeholder: 'Medical license number' },
        { key: 'password', label: 'Password', placeholder: 'Create password', type: 'password' },
        { key: 'confirmPassword', label: 'Confirm password', placeholder: 'Confirm password', type: 'password' }
      ]}
    />
  );
}

export function AdminRegisterPage() {
  return (
    <RegistrationPage
      tag="Admin registration"
      title="Create an administrator account."
      subtitle="Register administrator access for verification, reporting, and user management."
      eyebrow="Admin"
      heading="Create admin account"
      description={`Set up administrator access for system operations. Demo access code: ${DEMO_ADMIN_CODE}.`}
      submitLabel="Create account"
      submitBusyLabel="Creating account..."
      loginCopy="Already have admin access?"
      loginLabel="Sign in"
      buildPayload={(form) => ({
        name: form.name,
        email: form.email,
        adminCode: form.adminCode,
        password: form.password,
        confirmPassword: form.confirmPassword
      })}
      onSubmit={authApi.registerAdmin}
      fields={[
        { key: 'name', label: 'Full name', placeholder: 'Administrator name' },
        { key: 'email', label: 'Email', placeholder: 'admin@medicore.in', type: 'email' },
        { key: 'adminCode', label: 'Access code', placeholder: DEMO_ADMIN_CODE },
        { key: 'password', label: 'Password', placeholder: 'Create password', type: 'password' },
        { key: 'confirmPassword', label: 'Confirm password', placeholder: 'Confirm password', type: 'password' }
      ]}
    />
  );
}

function RegistrationPage({
  tag,
  title,
  subtitle,
  eyebrow,
  heading,
  description,
  fields,
  submitLabel,
  submitBusyLabel,
  loginCopy,
  loginLabel,
  buildPayload,
  onSubmit
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState(
    fields.reduce((current, field) => {
      current[field.key] = '';
      return current;
    }, {})
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await onSubmit(buildPayload(form));
      navigate('/auth/login', {
        replace: true,
        state: {
          success: response?.message || 'Registration completed successfully.'
        }
      });
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell tag={tag} title={title} subtitle={subtitle}>
      <section className="auth-form-card glass-surface tilt-card">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{heading}</h2>
        <p>{description}</p>

        <AlertMessage kind="danger" message={error} />

        <form className="auth-form-stack" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.key}>
              <label className="auth-label">{field.label}</label>
              <input
                className="form-control"
                placeholder={field.placeholder}
                type={field.type || 'text'}
                value={form[field.key]}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
              />
            </div>
          ))}

          <SubmitButton submitting={submitting} busyText={submitBusyLabel}>
            {submitLabel}
          </SubmitButton>
        </form>

        <div className="auth-switch">
          {loginCopy} <NavLink to="/auth/login">{loginLabel}</NavLink>
        </div>
      </section>
    </AuthPageShell>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await authApi.forgotPassword({ email });
      navigate(`/auth/reset-password?email=${encodeURIComponent(response.email)}`, {
        replace: true,
        state: {
          success: response.message
        }
      });
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      tag="Recovery"
      title="Recover access to your account."
      subtitle="Use your email address to continue to the password reset step."
    >
      <section className="auth-form-card glass-surface tilt-card">
        <span className="eyebrow">Recovery</span>
        <h2>Forgot password</h2>
        <p>Enter your email address to continue.</p>

        <AlertMessage kind="danger" message={error} />

        <form className="auth-form-stack" onSubmit={handleSubmit}>
          <div>
            <label className="auth-label">Email</label>
            <input className="form-control" placeholder="name@medicore.com" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          <SubmitButton submitting={submitting} busyText="Checking email...">
            Send reset link
          </SubmitButton>
        </form>

        <div className="auth-switch">
          Remembered it? <NavLink to="/auth/login">Back to login</NavLink>
        </div>
      </section>
    </AuthPageShell>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!email) {
    return <Navigate to="/auth/forgot-password" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await authApi.resetPassword({
        email,
        password,
        confirmPassword
      });

      navigate('/auth/login', {
        replace: true,
        state: {
          success: response.message
        }
      });
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell tag="Password reset" title="Set a new password." subtitle="Update your password and return to the login page.">
      <section className="auth-form-card glass-surface tilt-card">
        <span className="eyebrow">Reset</span>
        <h2>Set a new password</h2>
        <p>Create a new password for your account.</p>

        <AlertMessage kind="success" message={location.state?.success} />
        <AlertMessage kind="danger" message={error} />

        <form className="auth-form-stack" onSubmit={handleSubmit}>
          <div>
            <label className="auth-label">Email</label>
            <input className="form-control" readOnly type="email" value={email} />
          </div>

          <div>
            <label className="auth-label">New password</label>
            <input className="form-control" placeholder="Enter new password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>

          <div>
            <label className="auth-label">Confirm password</label>
            <input className="form-control" placeholder="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </div>

          <button type="submit" className="btn btn-success w-100" disabled={submitting}>
            {submitting ? 'Resetting password...' : 'Reset password'}
          </button>
        </form>

        <div className="auth-switch">
          Want to sign in directly? <NavLink to="/auth/login">Back to login</NavLink>
        </div>
      </section>
    </AuthPageShell>
  );
}
