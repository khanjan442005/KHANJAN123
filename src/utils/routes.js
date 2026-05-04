export function routeForRole(role) {
  if (role === 'Patient') {
    return '/patient/dashboard';
  }

  if (role === 'Doctor') {
    return '/doctor/dashboard';
  }

  if (role === 'Admin') {
    return '/admin/dashboard';
  }

  return '/';
}

function normalizePathname(pathname) {
  if (!pathname) {
    return '/';
  }

  const trimmedPath = pathname.replace(/\/+$/, '');
  return trimmedPath.length > 0 ? trimmedPath.toLowerCase() : '/';
}

function appendSearch(path, search, allowedKeys = null) {
  if (!search) {
    return path;
  }

  if (!allowedKeys || allowedKeys.length === 0) {
    return `${path}${search}`;
  }

  const input = new URLSearchParams(search);
  const output = new URLSearchParams();

  allowedKeys.forEach((key) => {
    const value = input.get(key);
    if (value) {
      output.set(key, value);
    }
  });

  const queryString = output.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function resolveLegacyRoute(pathname, search) {
  const normalizedPath = normalizePathname(pathname);
  const searchParams = new URLSearchParams(search);

  switch (normalizedPath) {
    case '/':
    case '/home':
    case '/home/index':
      return '/';
    case '/auth/login':
      return '/auth/login';
    case '/auth/register':
      return '/auth/register';
    case '/auth/forgotpassword':
      return '/auth/forgot-password';
    case '/auth/resetpassword': {
      const email = searchParams.get('email');
      return email ? `/auth/reset-password?email=${encodeURIComponent(email)}` : '/auth/forgot-password';
    }
    case '/auth/accessdenied':
      return '/auth/login';
    case '/patient/register':
      return '/auth/register/patient';
    case '/doctor/register':
      return '/auth/register/doctor';
    case '/admin/register':
      return '/auth/register/admin';
    case '/patient/dashboard':
      return '/patient/dashboard';
    case '/patient/finddoctor':
      return appendSearch('/patient/find-doctor', search, ['searchTerm', 'specialization']);
    case '/patient/doctorprofile': {
      const doctorId = searchParams.get('id');
      return doctorId ? `/patient/doctors/${encodeURIComponent(doctorId)}` : '/patient/find-doctor';
    }
    case '/patient/bookappointment': {
      const doctorId = searchParams.get('doctorId');
      return doctorId ? `/patient/book/${encodeURIComponent(doctorId)}` : '/patient/find-doctor';
    }
    case '/patient/bookingconfirm': {
      const appointmentId = searchParams.get('appointmentId');
      return appointmentId ? `/patient/booking-confirm/${encodeURIComponent(appointmentId)}` : '/patient/appointments';
    }
    case '/patient/payment': {
      const appointmentId = searchParams.get('appointmentId');
      return appointmentId ? `/patient/payment/${encodeURIComponent(appointmentId)}` : '/patient/appointments';
    }
    case '/patient/appointmenthistory':
      return '/patient/appointments';
    case '/patient/notifications':
      return '/patient/notifications';
    case '/patient/profile':
      return '/patient/profile';
    case '/doctor/dashboard':
      return '/doctor/dashboard';
    case '/doctor/appointments':
      return appendSearch('/doctor/appointments', search, ['searchTerm', 'statusFilter', 'paymentFilter']);
    case '/doctor/profile':
      return '/doctor/profile';
    case '/doctor/availability':
      return '/doctor/availability';
    case '/doctor/earnings':
      return '/doctor/earnings';
    case '/admin/dashboard':
      return '/admin/dashboard';
    case '/admin/doctorverification':
      return appendSearch('/admin/doctor-verification', search, ['searchTerm', 'statusFilter']);
    case '/admin/appointments':
      return appendSearch('/admin/appointments', search, ['searchTerm', 'statusFilter', 'paymentFilter']);
    case '/admin/usermanagement':
      return appendSearch('/admin/users', search, ['searchTerm', 'roleFilter', 'statusFilter']);
    case '/admin/adddoctor':
      return '/admin/add-doctor';
    case '/admin/reports':
      return '/admin/reports';
    case '/home/error':
      return '/';
    default:
      return null;
  }
}
