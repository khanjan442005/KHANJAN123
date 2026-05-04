import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { formatCurrency, formatDateLabel } from '../../src/utils/formatters.js';
import { routeForRole } from '../../src/utils/routes.js';

const PLATFORM_FEE = 50;
const ADMIN_ACCESS_CODE = 'MEDICORE-ADMIN';
const STATE_VERSION = 3;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '../data/medicore-db.json');

let cachedState = null;
let activeSessionToken = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createError(message) {
  return new Error(message);
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value, amount) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function toDateOnly(value) {
  const date = startOfDay(value);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimestamp(value) {
  return new Date(value).toISOString();
}

function formatCreatedAtLabel(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

function getDayLabel(value) {
  const date = new Date(`${value}T00:00:00`);
  return DAY_LABELS[date.getDay()];
}

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function buildAvatar(name, foreground, background) {
  const initials = getInitials(name) || 'MC';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="${initials}"><rect width="120" height="120" rx="28" fill="${background}"/><text x="50%" y="55%" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="42" font-weight="700" fill="${foreground}">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function countBy(items, getKey) {
  return items.reduce((result, item) => {
    const key = getKey(item);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function sumBy(items, selector) {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0);
}

function isPaidAppointment(appointment) {
  return appointment.paymentStatus === 'Paid';
}

function isUpcomingAppointment(appointment) {
  return appointment.status !== 'Completed' && appointment.appointmentDate >= toDateOnly(new Date());
}

function createDoctorAvailabilitySet(doctorId, variant = 'morning') {
  if (variant === 'mixed') {
    return [
      {
        doctorId,
        dayLabel: 'Tue',
        sessionLabel: 'Morning',
        timeRange: '10:00 - 13:00',
        slotValues: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM']
      },
      {
        doctorId,
        dayLabel: 'Thu',
        sessionLabel: 'Evening',
        timeRange: '16:00 - 19:00',
        slotValues: ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM']
      },
      {
        doctorId,
        dayLabel: 'Sat',
        sessionLabel: 'Morning',
        timeRange: '09:30 - 12:30',
        slotValues: ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM']
      }
    ];
  }

  return [
    {
      doctorId,
      dayLabel: 'Mon',
      sessionLabel: 'Morning',
      timeRange: '09:00 - 12:00',
      slotValues: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM']
    },
    {
      doctorId,
      dayLabel: 'Wed',
      sessionLabel: 'Evening',
      timeRange: '16:00 - 18:00',
      slotValues: ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM']
    },
    {
      doctorId,
      dayLabel: 'Fri',
      sessionLabel: 'Morning',
      timeRange: '09:00 - 11:00',
      slotValues: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM']
    }
  ];
}

function createSeedState() {
  const now = new Date();
  const patientUserId = 1;
  const doctorUserId = 2;
  const adminUserId = 3;
  const doctorTwoUserId = 4;
  const pendingDoctorUserId = 5;
  const patientTwoUserId = 6;

  const users = [
    {
      id: patientUserId,
      role: 'Patient',
      email: 'patient@medicore.com',
      password: 'patient123',
      displayName: 'Aarav Shah',
      initials: 'AS',
      entityId: 1,
      createdAt: toTimestamp(addDays(now, -18))
    },
    {
      id: doctorUserId,
      role: 'Doctor',
      email: 'doctor@medicore.in',
      password: 'doctor123',
      displayName: 'Dr. Meera Iyer',
      initials: 'DM',
      entityId: 1,
      createdAt: toTimestamp(addDays(now, -35))
    },
    {
      id: adminUserId,
      role: 'Admin',
      email: 'admin@medicore.in',
      password: 'admin123',
      displayName: 'Riya Patel',
      initials: 'RP',
      entityId: 1,
      createdAt: toTimestamp(addDays(now, -60))
    },
    {
      id: doctorTwoUserId,
      role: 'Doctor',
      email: 'skin@medicore.in',
      password: 'doctor123',
      displayName: 'Dr. Kavya Desai',
      initials: 'DK',
      entityId: 2,
      createdAt: toTimestamp(addDays(now, -22))
    },
    {
      id: pendingDoctorUserId,
      role: 'Doctor',
      email: 'pending@medicore.in',
      password: 'doctor123',
      displayName: 'Dr. Raj Patel',
      initials: 'DR',
      entityId: 3,
      createdAt: toTimestamp(addDays(now, -4))
    },
    {
      id: patientTwoUserId,
      role: 'Patient',
      email: 'neha@medicore.com',
      password: 'patient123',
      displayName: 'Neha Joshi',
      initials: 'NJ',
      entityId: 2,
      createdAt: toTimestamp(addDays(now, -10))
    }
  ];

  const patients = [
    {
      id: 1,
      userId: patientUserId,
      fullName: 'Aarav Shah',
      email: 'patient@medicore.com',
      phone: '+91 98765 43210',
      address: 'Ahmedabad, Gujarat',
      dateOfBirth: '1998-08-14',
      avatarPath: buildAvatar('Aarav Shah', '#ffffff', '#1f4f8f')
    },
    {
      id: 2,
      userId: patientTwoUserId,
      fullName: 'Neha Joshi',
      email: 'neha@medicore.com',
      phone: '+91 98989 12233',
      address: 'Vadodara, Gujarat',
      dateOfBirth: '1994-03-09',
      avatarPath: buildAvatar('Neha Joshi', '#ffffff', '#3d7ad6')
    }
  ];

  const doctors = [
    {
      id: 1,
      userId: doctorUserId,
      fullName: 'Dr. Meera Iyer',
      email: 'doctor@medicore.in',
      specialization: 'Cardiology',
      licenseNumber: 'GJ-MCI-2741',
      experienceYears: 12,
      city: 'Ahmedabad',
      consultationFee: 900,
      hospitalName: 'City Heart Clinic',
      bio: 'Focused on preventive cardiology, routine diagnostics, and long-term cardiac care.',
      languages: 'English, Hindi, Gujarati',
      rating: 4.8,
      verificationStatus: 'Approved',
      requestedAt: toTimestamp(addDays(now, -35)),
      verifiedAt: toTimestamp(addDays(now, -30)),
      avatarPath: buildAvatar('Dr. Meera Iyer', '#ffffff', '#142f55')
    },
    {
      id: 2,
      userId: doctorTwoUserId,
      fullName: 'Dr. Kavya Desai',
      email: 'skin@medicore.in',
      specialization: 'Dermatology',
      licenseNumber: 'GJ-MCI-1988',
      experienceYears: 9,
      city: 'Surat',
      consultationFee: 750,
      hospitalName: 'Glow Skin Centre',
      bio: 'Consults on acne, skin health, pigmentation, and preventative dermatology care.',
      languages: 'English, Hindi',
      rating: 4.6,
      verificationStatus: 'Approved',
      requestedAt: toTimestamp(addDays(now, -22)),
      verifiedAt: toTimestamp(addDays(now, -20)),
      avatarPath: buildAvatar('Dr. Kavya Desai', '#ffffff', '#8b95a7')
    },
    {
      id: 3,
      userId: pendingDoctorUserId,
      fullName: 'Dr. Raj Patel',
      email: 'pending@medicore.in',
      specialization: 'Orthopedics',
      licenseNumber: 'GJ-MCI-4210',
      experienceYears: 6,
      city: 'Vadodara',
      consultationFee: 800,
      hospitalName: 'Axis Bone Care',
      bio: 'Handles joint pain, mobility plans, and post-injury orthopedic consultation.',
      languages: 'English, Hindi, Gujarati',
      rating: 4.3,
      verificationStatus: 'Pending',
      requestedAt: toTimestamp(addDays(now, -4)),
      verifiedAt: null,
      avatarPath: buildAvatar('Dr. Raj Patel', '#ffffff', '#3d7ad6')
    }
  ];

  const admins = [
    {
      id: 1,
      userId: adminUserId,
      fullName: 'Riya Patel',
      email: 'admin@medicore.in',
      adminCode: 'MEDICORE-ADMIN'
    }
  ];

  const appointments = [
    {
      id: 1,
      patientId: 1,
      doctorId: 1,
      appointmentDate: toDateOnly(now),
      timeSlot: '10:00 AM',
      status: 'Confirmed',
      paymentStatus: 'Paid',
      paymentMethod: 'UPI',
      consultationFee: 900,
      platformFee: PLATFORM_FEE,
      totalAmount: 950,
      createdAt: toTimestamp(addDays(now, -2))
    },
    {
      id: 2,
      patientId: 1,
      doctorId: 1,
      appointmentDate: toDateOnly(addDays(now, 2)),
      timeSlot: '11:30 AM',
      status: 'Payment Pending',
      paymentStatus: 'Pending',
      paymentMethod: 'Not selected',
      consultationFee: 900,
      platformFee: PLATFORM_FEE,
      totalAmount: 950,
      createdAt: toTimestamp(addDays(now, -1))
    },
    {
      id: 3,
      patientId: 1,
      doctorId: 2,
      appointmentDate: toDateOnly(addDays(now, -3)),
      timeSlot: '04:30 PM',
      status: 'Completed',
      paymentStatus: 'Paid',
      paymentMethod: 'Card',
      consultationFee: 750,
      platformFee: PLATFORM_FEE,
      totalAmount: 800,
      createdAt: toTimestamp(addDays(now, -8))
    },
    {
      id: 4,
      patientId: 2,
      doctorId: 1,
      appointmentDate: toDateOnly(addDays(now, 4)),
      timeSlot: '09:30 AM',
      status: 'Confirmed',
      paymentStatus: 'Paid',
      paymentMethod: 'Net Banking',
      consultationFee: 900,
      platformFee: PLATFORM_FEE,
      totalAmount: 950,
      createdAt: toTimestamp(addDays(now, -5))
    }
  ];

  const notifications = [
    {
      id: 1,
      patientId: 1,
      label: 'Confirmed',
      title: 'Appointment confirmed',
      message: 'Your visit with Dr. Meera Iyer is confirmed and synced with the clinic schedule.',
      createdAt: toTimestamp(addDays(now, -2))
    },
    {
      id: 2,
      patientId: 1,
      label: 'Payment',
      title: 'Payment pending',
      message: 'Finish your payment to confirm the upcoming cardiology appointment.',
      createdAt: toTimestamp(addDays(now, -1))
    },
    {
      id: 3,
      patientId: 1,
      label: 'Reminder',
      title: 'Visit completed',
      message: 'Your last dermatology appointment was marked as completed in the system.',
      createdAt: toTimestamp(addDays(now, -3))
    }
  ];

  const availabilities = [
    ...createDoctorAvailabilitySet(1, 'morning'),
    ...createDoctorAvailabilitySet(2, 'mixed'),
    ...createDoctorAvailabilitySet(3, 'morning')
  ];

  return {
    schemaVersion: STATE_VERSION,
    sessions: [],
    users,
    patients,
    doctors,
    admins,
    appointments,
    notifications,
    availabilities
  };
}

function readState() {
  if (cachedState) {
    return cachedState;
  }

  if (!fs.existsSync(DATA_PATH)) {
    const seed = createSeedState();
    writeState(seed);
    return seed;
  }

  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion === STATE_VERSION) {
      cachedState = {
        ...parsed,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
      };
      return cachedState;
    }

    const seed = createSeedState();
    writeState(seed);
    return seed;
  } catch {
    const seed = createSeedState();
    writeState(seed);
    return seed;
  }
}

function writeState(state) {
  const nextState = {
    ...state,
    schemaVersion: STATE_VERSION,
    sessions: Array.isArray(state.sessions) ? state.sessions : []
  };

  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(nextState, null, 2));
  cachedState = nextState;
  return nextState;
}

function readSessionUserId() {
  const state = readState();
  if (!activeSessionToken) {
    return null;
  }

  const session = state.sessions.find((item) => item.token === activeSessionToken);
  return session ? Number(session.userId) : null;
}

function createSessionToken(state, userId) {
  const token = crypto.randomUUID();
  state.sessions = (state.sessions || []).filter((item) => item.userId !== Number(userId));
  state.sessions.push({
    token,
    userId: Number(userId),
    createdAt: new Date().toISOString()
  });
  return token;
}

function removeSessionToken(state, token) {
  state.sessions = (state.sessions || []).filter((item) => item.token !== token);
}

function removeUserSessions(state, userId) {
  state.sessions = (state.sessions || []).filter((item) => item.userId !== Number(userId));
}

function getUserById(state, userId) {
  return state.users.find((user) => user.id === Number(userId)) || null;
}

function getPatientByUserId(state, userId) {
  return state.patients.find((patient) => patient.userId === Number(userId)) || null;
}

function getDoctorByUserId(state, userId) {
  return state.doctors.find((doctor) => doctor.userId === Number(userId)) || null;
}

function assertDoctorAccess(doctor) {
  if (!doctor) {
    throw createError('Doctor profile was not found.');
  }

  if (doctor.verificationStatus === 'Pending') {
    throw createError('Doctor account is waiting for admin approval.');
  }

  if (doctor.verificationStatus === 'Rejected') {
    throw createError('Doctor account was rejected. Contact the admin team.');
  }

  if (doctor.verificationStatus !== 'Approved') {
    throw createError('Doctor account is not approved for portal access.');
  }

  return doctor;
}

function getCurrentUser(state) {
  return getUserById(state, readSessionUserId());
}

function requireUser(state) {
  const user = getCurrentUser(state);
  if (!user) {
    throw createError('Please sign in to continue.');
  }

  return user;
}

function requireRole(state, role) {
  const user = requireUser(state);
  if (user.role !== role) {
    throw createError(`This action requires a ${role} account.`);
  }

  return user;
}

function ensureUniqueEmail(state, email) {
  const normalized = String(email || '').trim().toLowerCase();
  const existing = state.users.find((user) => user.email.toLowerCase() === normalized);
  if (existing) {
    throw createError('An account with this email already exists.');
  }
}

function validatePasswordPair(password, confirmPassword) {
  if (!password || password.length < 6) {
    throw createError('Password must be at least 6 characters long.');
  }

  if (password !== confirmPassword) {
    throw createError('Password and confirm password do not match.');
  }
}

function getDoctorStatusLabel(doctor) {
  if (doctor.verificationStatus === 'Approved') {
    return 'Verified';
  }

  return doctor.verificationStatus;
}

function getApprovedDoctors(state) {
  return state.doctors.filter((doctor) => doctor.verificationStatus === 'Approved');
}

function getDoctorScheduleEntries(state, doctorId) {
  return state.availabilities.filter((item) => item.doctorId === Number(doctorId));
}

function getNextAvailabilityLabel(state, doctorId) {
  const schedule = getDoctorScheduleEntries(state, doctorId);
  if (schedule.length === 0) {
    return 'No schedule saved';
  }

  const first = schedule[0];
  return `${first.dayLabel} ${first.timeRange}`;
}

function getDoctorSlotOptions(state, doctorId) {
  const slotMap = new Map();

  getDoctorScheduleEntries(state, doctorId).forEach((entry) => {
    entry.slotValues.forEach((value) => {
      const current = slotMap.get(value) || { value, availableDays: [] };
      if (!current.availableDays.includes(entry.dayLabel)) {
        current.availableDays.push(entry.dayLabel);
      }
      slotMap.set(value, current);
    });
  });

  return Array.from(slotMap.values());
}

function getAppointmentView(state, appointment) {
  const patient = state.patients.find((item) => item.id === appointment.patientId);
  const doctor = state.doctors.find((item) => item.id === appointment.doctorId);

  return {
    id: appointment.id,
    patientName: patient?.fullName || 'Unknown patient',
    doctorName: doctor?.fullName || 'Unknown doctor',
    doctorSpecialization: doctor?.specialization || 'General',
    dateLabel: formatDateLabel(appointment.appointmentDate),
    timeSlot: appointment.timeSlot,
    status: appointment.status,
    paymentStatus: appointment.paymentStatus,
    paymentMethod: appointment.paymentMethod,
    feeLabel: formatCurrency(appointment.totalAmount),
    createdAtLabel: formatCreatedAtLabel(appointment.createdAt),
    canContinuePayment: appointment.paymentStatus !== 'Paid'
  };
}

function buildNotificationView(items) {
  return items
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((item, index) => ({
      id: item.id,
      indexLabel: String(index + 1).padStart(2, '0'),
      title: item.title,
      message: item.message,
      timeLabel: formatCreatedAtLabel(item.createdAt),
      label: item.label
    }));
}

function buildBreakdownRows(counts, details, formatValue) {
  return Object.entries(counts).map(([label, value]) => ({
    label,
    detail: details[label] || 'Live count',
    valueLabel: formatValue(value)
  }));
}

function getRevenueTrendLabel(appointments) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const previousMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const previousYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const currentValue = sumBy(
    appointments.filter((appointment) => {
      const date = new Date(appointment.createdAt);
      return isPaidAppointment(appointment) && date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }),
    (appointment) => appointment.totalAmount
  );

  const previousValue = sumBy(
    appointments.filter((appointment) => {
      const date = new Date(appointment.createdAt);
      return isPaidAppointment(appointment) && date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    }),
    (appointment) => appointment.totalAmount
  );

  if (previousValue === 0) {
    return currentValue > 0 ? '+100%' : '0%';
  }

  const change = Math.round(((currentValue - previousValue) / previousValue) * 100);
  return `${change >= 0 ? '+' : ''}${change}%`;
}

function sumCurrentMonth(appointments) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return sumBy(
    appointments.filter((appointment) => {
      const date = new Date(appointment.createdAt);
      return date.getMonth() === month && date.getFullYear() === year;
    }),
    (appointment) => appointment.totalAmount
  );
}

function getApprovalRateLabel(state) {
  const total = state.doctors.length;
  if (total === 0) {
    return '0%';
  }

  const approved = state.doctors.filter((doctor) => doctor.verificationStatus === 'Approved').length;
  return `${Math.round((approved / total) * 100)}%`;
}

function getPatientContext(state) {
  const user = requireRole(state, 'Patient');
  const patient = getPatientByUserId(state, user.id);
  if (!patient) {
    throw createError('Patient profile was not found.');
  }

  return { user, patient };
}

function getDoctorContext(state) {
  const user = requireRole(state, 'Doctor');
  const doctor = assertDoctorAccess(getDoctorByUserId(state, user.id));

  return { user, doctor };
}

function getSessionPayload(state, user) {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    displayName: user.displayName,
    initials: user.initials,
    entityId: user.entityId,
    isAuthenticated: true
  };
}

function addNotification(state, patientId, label, title, message) {
  state.notifications.push({
    id: nextId(state.notifications),
    patientId,
    label,
    title,
    message,
    createdAt: new Date().toISOString()
  });
}

export async function withSession(sessionToken, operation) {
  activeSessionToken = sessionToken || null;

  try {
    return await operation();
  } finally {
    activeSessionToken = null;
  }
}

export async function login(payload) {
  const state = readState();
  const role = String(payload?.role || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const password = String(payload?.password || '');
  const user = state.users.find((item) => item.role === role && item.email.toLowerCase() === email);

  if (!user || user.password !== password) {
    throw createError('Invalid role, email, or password.');
  }

  if (user.role === 'Doctor') {
    assertDoctorAccess(getDoctorByUserId(state, user.id));
  }

  const sessionToken = createSessionToken(state, user.id);
  writeState(state);

  return {
    message: 'Login successful.',
    redirectTo: routeForRole(user.role),
    sessionToken
  };
}

export async function getMe() {
  const state = readState();
  const user = getCurrentUser(state);

  if (!user) {
    return { isAuthenticated: false };
  }

  if (user.role === 'Doctor') {
    try {
      assertDoctorAccess(getDoctorByUserId(state, user.id));
    } catch {
      if (activeSessionToken) {
        removeSessionToken(state, activeSessionToken);
        writeState(state);
      }
      return { isAuthenticated: false };
    }
  }

  return getSessionPayload(state, user);
}

export async function logout() {
  const state = readState();
  if (activeSessionToken) {
    removeSessionToken(state, activeSessionToken);
    writeState(state);
  }

  return { message: 'Logged out successfully.' };
}

export async function forgotPassword(payload) {
  const state = readState();
  const email = String(payload?.email || '').trim().toLowerCase();
  const user = state.users.find((item) => item.email.toLowerCase() === email);

  if (!user) {
    throw createError('No account was found for this email.');
  }

  return {
    email: user.email,
    message: 'Email verified. You can now set a new password.'
  };
}

export async function resetPassword(payload) {
  const state = readState();
  const email = String(payload?.email || '').trim().toLowerCase();
  const user = state.users.find((item) => item.email.toLowerCase() === email);

  if (!user) {
    throw createError('No account was found for this email.');
  }

  validatePasswordPair(payload?.password, payload?.confirmPassword);
  user.password = payload.password;
  writeState(state);

  return {
    message: 'Password updated successfully. Please sign in again.'
  };
}

export async function registerPatient(payload) {
  const state = readState();
  ensureUniqueEmail(state, payload?.email);
  validatePasswordPair(payload?.password, payload?.confirmPassword);

  const userId = nextId(state.users);
  const patientId = nextId(state.patients);
  const fullName = String(payload?.name || '').trim();
  if (!fullName) {
    throw createError('Full name is required.');
  }

  state.users.push({
    id: userId,
    role: 'Patient',
    email: String(payload.email).trim(),
    password: payload.password,
    displayName: fullName,
    initials: getInitials(fullName),
    entityId: patientId,
    createdAt: new Date().toISOString()
  });

  state.patients.push({
    id: patientId,
    userId,
    fullName,
    email: String(payload.email).trim(),
    phone: '+91 90000 00000',
    address: 'Gujarat, India',
    dateOfBirth: '1999-01-01',
    avatarPath: buildAvatar(fullName, '#ffffff', '#1f4f8f')
  });

  writeState(state);

  return {
    message: 'Patient account created successfully.'
  };
}

export async function registerDoctor(payload) {
  const state = readState();
  ensureUniqueEmail(state, payload?.email);
  validatePasswordPair(payload?.password, payload?.confirmPassword);

  const fullName = String(payload?.name || '').trim();
  const specialization = String(payload?.specialization || '').trim();
  const licenseNumber = String(payload?.license || '').trim();

  if (!fullName || !specialization || !licenseNumber) {
    throw createError('Doctor name, specialization, and license number are required.');
  }

  const userId = nextId(state.users);
  const doctorId = nextId(state.doctors);

  state.users.push({
    id: userId,
    role: 'Doctor',
    email: String(payload.email).trim(),
    password: payload.password,
    displayName: fullName,
    initials: getInitials(fullName),
    entityId: doctorId,
    createdAt: new Date().toISOString()
  });

  state.doctors.push({
    id: doctorId,
    userId,
    fullName,
    email: String(payload.email).trim(),
    specialization,
    licenseNumber,
    experienceYears: 5,
    city: 'Ahmedabad',
    consultationFee: 800,
    hospitalName: 'New Care Clinic',
    bio: 'Newly registered doctor profile waiting for admin review.',
    languages: 'English, Hindi',
    rating: 4.2,
    verificationStatus: 'Pending',
    requestedAt: new Date().toISOString(),
    verifiedAt: null,
    avatarPath: buildAvatar(fullName, '#ffffff', '#3d7ad6')
  });

  state.availabilities.push(...createDoctorAvailabilitySet(doctorId, 'mixed'));
  writeState(state);

  return {
    message: 'Doctor account created. It is now waiting for admin approval.'
  };
}

export async function registerAdmin(payload) {
  const state = readState();
  ensureUniqueEmail(state, payload?.email);
  validatePasswordPair(payload?.password, payload?.confirmPassword);

  const fullName = String(payload?.name || '').trim();
  const adminCode = String(payload?.adminCode || '').trim();

  if (!fullName || !adminCode) {
    throw createError('Admin name and access code are required.');
  }

  if (adminCode !== ADMIN_ACCESS_CODE) {
    throw createError(`Invalid admin access code. Use ${ADMIN_ACCESS_CODE}.`);
  }

  const userId = nextId(state.users);
  const adminId = nextId(state.admins);

  state.users.push({
    id: userId,
    role: 'Admin',
    email: String(payload.email).trim(),
    password: payload.password,
    displayName: fullName,
    initials: getInitials(fullName),
    entityId: adminId,
    createdAt: new Date().toISOString()
  });

  state.admins.push({
    id: adminId,
    userId,
    fullName,
    email: String(payload.email).trim(),
    adminCode
  });

  writeState(state);

  return {
    message: 'Administrator account created successfully.'
  };
}

export async function getPatientDashboard() {
  const state = readState();
  const { patient } = getPatientContext(state);
  const patientAppointments = state.appointments.filter((appointment) => appointment.patientId === patient.id);
  const upcomingAppointments = patientAppointments.filter(isUpcomingAppointment).map((appointment) => getAppointmentView(state, appointment));
  const notifications = buildNotificationView(state.notifications.filter((item) => item.patientId === patient.id));
  const featuredDoctors = getApprovedDoctors(state)
    .slice()
    .sort((left, right) => right.rating - left.rating)
    .slice(0, 3)
    .map((doctor) => clone(doctor));

  return {
    patient: clone(patient),
    upcomingAppointmentsCount: upcomingAppointments.length,
    totalVisitsCount: patientAppointments.length,
    savedDoctorsCount: getApprovedDoctors(state).length,
    pendingPaymentsCount: patientAppointments.filter((appointment) => appointment.paymentStatus !== 'Paid').length,
    upcomingAppointments,
    featuredDoctors,
    recentNotifications: notifications.slice(0, 3)
  };
}

export async function findDoctors(params = {}) {
  const state = readState();
  requireRole(state, 'Patient');
  const searchTerm = String(params.searchTerm || '').trim().toLowerCase();
  const specialization = String(params.specialization || '').trim().toLowerCase();

  const doctors = getApprovedDoctors(state)
    .filter((doctor) => {
      const matchesSearch =
        !searchTerm ||
        [doctor.fullName, doctor.specialization, doctor.hospitalName, doctor.city]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm);

      const matchesSpecialization = !specialization || doctor.specialization.toLowerCase() === specialization;
      return matchesSearch && matchesSpecialization;
    })
    .sort((left, right) => right.rating - left.rating)
    .map((doctor) => clone(doctor));

  return {
    doctors,
    verifiedDoctorsCount: getApprovedDoctors(state).length,
    pendingReviewCount: state.doctors.filter((doctor) => doctor.verificationStatus === 'Pending').length,
    specializations: Array.from(new Set(getApprovedDoctors(state).map((doctor) => doctor.specialization))).sort()
  };
}

export async function getPatientDoctorProfile(doctorId) {
  const state = readState();
  requireRole(state, 'Patient');
  const doctor = state.doctors.find((item) => item.id === Number(doctorId) && item.verificationStatus === 'Approved');
  if (!doctor) {
    throw createError('Doctor profile was not found.');
  }

  return {
    doctor: clone(doctor),
    availableSlots: getDoctorSlotOptions(state, doctor.id)
      .slice(0, 8)
      .map((item) => item.value)
  };
}

export async function getBookingPage(doctorId) {
  const state = readState();
  requireRole(state, 'Patient');
  const doctor = state.doctors.find((item) => item.id === Number(doctorId) && item.verificationStatus === 'Approved');
  if (!doctor) {
    throw createError('Doctor was not found for booking.');
  }

  return {
    doctor: clone(doctor),
    minimumDate: toDateOnly(new Date()),
    input: {
      appointmentDate: '',
      timeSlot: ''
    },
    slotOptions: getDoctorSlotOptions(state, doctor.id),
    scheduleItems: clone(getDoctorScheduleEntries(state, doctor.id))
  };
}

export async function createAppointment(payload) {
  const state = readState();
  const { patient } = getPatientContext(state);
  const doctor = state.doctors.find((item) => item.id === Number(payload?.doctorId) && item.verificationStatus === 'Approved');
  if (!doctor) {
    throw createError('Selected doctor is not available for booking.');
  }

  const appointmentDate = String(payload?.appointmentDate || '').trim();
  const timeSlot = String(payload?.timeSlot || '').trim();
  if (!appointmentDate || !timeSlot) {
    throw createError('Select both appointment date and time slot.');
  }

  if (appointmentDate < toDateOnly(new Date())) {
    throw createError('Appointment date cannot be in the past.');
  }

  const selectedDay = getDayLabel(appointmentDate);
  const allowedSlots = getDoctorScheduleEntries(state, doctor.id)
    .filter((entry) => entry.dayLabel === selectedDay)
    .flatMap((entry) => entry.slotValues);

  if (!allowedSlots.includes(timeSlot)) {
    throw createError('Selected time slot is not available on that day.');
  }

  const alreadyBooked = state.appointments.some(
    (appointment) =>
      appointment.doctorId === doctor.id &&
      appointment.appointmentDate === appointmentDate &&
      appointment.timeSlot === timeSlot &&
      appointment.status !== 'Completed'
  );

  if (alreadyBooked) {
    throw createError('That appointment slot has already been booked.');
  }

  const appointmentId = nextId(state.appointments);
  state.appointments.push({
    id: appointmentId,
    patientId: patient.id,
    doctorId: doctor.id,
    appointmentDate,
    timeSlot,
    status: 'Payment Pending',
    paymentStatus: 'Pending',
    paymentMethod: 'Not selected',
    consultationFee: Number(doctor.consultationFee || 0),
    platformFee: PLATFORM_FEE,
    totalAmount: Number(doctor.consultationFee || 0) + PLATFORM_FEE,
    createdAt: new Date().toISOString()
  });

  addNotification(
    state,
    patient.id,
    'Payment',
    'Appointment created',
    `Your booking request with ${doctor.fullName} is saved. Complete payment to confirm it.`
  );

  writeState(state);

  return {
    id: appointmentId,
    appointmentId
  };
}

export async function getPaymentPage(appointmentId) {
  const state = readState();
  const { patient } = getPatientContext(state);
  const appointment = state.appointments.find((item) => item.id === Number(appointmentId) && item.patientId === patient.id);
  if (!appointment) {
    throw createError('Payment record was not found.');
  }

  const doctor = state.doctors.find((item) => item.id === appointment.doctorId);

  return {
    patient: clone(patient),
    doctor: clone(doctor),
    appointment: clone(appointment),
    input: {
      paymentMethod: appointment.paymentMethod === 'Not selected' ? 'UPI' : appointment.paymentMethod
    }
  };
}

export async function completeAppointmentPayment(appointmentId, payload) {
  const state = readState();
  const { patient } = getPatientContext(state);
  const appointment = state.appointments.find((item) => item.id === Number(appointmentId) && item.patientId === patient.id);
  if (!appointment) {
    throw createError('Appointment was not found.');
  }

  if (appointment.paymentStatus === 'Paid') {
    throw createError('This appointment is already paid.');
  }

  const paymentMethod = String(payload?.paymentMethod || '').trim();
  if (!paymentMethod) {
    throw createError('Choose a payment method.');
  }

  if (paymentMethod === 'Card' && (!payload?.cardNumber || !payload?.expiry || !payload?.cvc)) {
    throw createError('Enter card number, expiry, and CVC to continue.');
  }

  appointment.paymentMethod = paymentMethod;
  appointment.paymentStatus = 'Paid';
  appointment.status = appointment.appointmentDate < toDateOnly(new Date()) ? 'Completed' : 'Confirmed';

  const doctor = state.doctors.find((item) => item.id === appointment.doctorId);
  addNotification(
    state,
    patient.id,
    'Confirmed',
    'Payment confirmed',
    `Your appointment with ${doctor?.fullName || 'the doctor'} is now confirmed.`
  );

  writeState(state);

  return {
    appointmentId: appointment.id
  };
}

export async function getBookingConfirmation(appointmentId) {
  const state = readState();
  const { patient } = getPatientContext(state);
  const appointment = state.appointments.find((item) => item.id === Number(appointmentId) && item.patientId === patient.id);
  if (!appointment) {
    throw createError('Confirmed booking was not found.');
  }

  if (appointment.paymentStatus !== 'Paid') {
    throw createError('Complete payment before opening the booking confirmation page.');
  }

  const doctor = state.doctors.find((item) => item.id === appointment.doctorId);

  return {
    patient: clone(patient),
    doctor: clone(doctor),
    appointment: clone(appointment)
  };
}

export async function getPatientAppointmentHistory() {
  const state = readState();
  const { patient } = getPatientContext(state);

  return {
    appointments: state.appointments
      .filter((appointment) => appointment.patientId === patient.id)
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .map((appointment) => getAppointmentView(state, appointment))
  };
}

export async function getPatientNotifications() {
  const state = readState();
  const { patient } = getPatientContext(state);

  return {
    notifications: buildNotificationView(state.notifications.filter((item) => item.patientId === patient.id))
  };
}

export async function getPatientProfile() {
  const state = readState();
  const { patient } = getPatientContext(state);
  const appointments = state.appointments.filter((appointment) => appointment.patientId === patient.id);
  const notifications = state.notifications.filter((item) => item.patientId === patient.id);

  return {
    patient: {
      ...clone(patient),
      statusLabel: 'Care member',
      dateOfBirthLabel: formatDateLabel(patient.dateOfBirth)
    },
    activeAppointmentsCount: appointments.filter(isUpcomingAppointment).length,
    notificationCount: notifications.length
  };
}

export async function getDoctorDashboard() {
  const state = readState();
  const { doctor } = getDoctorContext(state);
  const appointments = state.appointments.filter((appointment) => appointment.doctorId === doctor.id);
  const todayLabel = toDateOnly(new Date());
  const paidAppointments = appointments.filter(isPaidAppointment);

  return {
    doctor: clone(doctor),
    todaysAppointmentsCount: appointments.filter((appointment) => appointment.appointmentDate === todayLabel).length,
    totalPatientsCount: new Set(appointments.map((appointment) => appointment.patientId)).size,
    pendingActionsCount: appointments.filter((appointment) => appointment.paymentStatus !== 'Paid').length,
    pendingRevenueLabel: formatCurrency(sumBy(appointments.filter((appointment) => appointment.paymentStatus !== 'Paid'), (item) => item.totalAmount)),
    monthlyEarningsLabel: formatCurrency(sumCurrentMonth(paidAppointments)),
    upcomingAppointmentsCount: appointments.filter(isUpcomingAppointment).length,
    completedAppointmentsCount: appointments.filter((appointment) => appointment.status === 'Completed').length,
    nextAvailabilityLabel: getNextAvailabilityLabel(state, doctor.id),
    upcomingAppointments: appointments.filter(isUpcomingAppointment).map((appointment) => getAppointmentView(state, appointment)).slice(0, 4),
    todayAppointments: appointments.filter((appointment) => appointment.appointmentDate === todayLabel).map((appointment) => getAppointmentView(state, appointment)).slice(0, 4),
    pendingPaymentAppointments: appointments.filter((appointment) => appointment.paymentStatus !== 'Paid').map((appointment) => getAppointmentView(state, appointment)).slice(0, 4)
  };
}

export async function getDoctorAppointments(params = {}) {
  const state = readState();
  const { doctor } = getDoctorContext(state);
  const searchTerm = String(params.searchTerm || '').trim().toLowerCase();
  const statusFilter = String(params.statusFilter || 'All');
  const paymentFilter = String(params.paymentFilter || 'All');

  const appointments = state.appointments
    .filter((appointment) => appointment.doctorId === doctor.id)
    .filter((appointment) => {
      const view = getAppointmentView(state, appointment);
      const matchesSearch =
        !searchTerm ||
        [view.patientName, view.dateLabel, view.timeSlot, view.status, view.paymentStatus, view.paymentMethod]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || appointment.status === statusFilter;
      const matchesPayment = paymentFilter === 'All' || appointment.paymentStatus === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    })
    .slice()
    .sort((left, right) => new Date(left.appointmentDate) - new Date(right.appointmentDate));

  const paidAppointments = appointments.filter(isPaidAppointment);

  return {
    totalAppointmentsCount: appointments.length,
    confirmedAppointmentsCount: appointments.filter((appointment) => appointment.status === 'Confirmed').length,
    completedAppointmentsCount: appointments.filter((appointment) => appointment.status === 'Completed').length,
    pendingAppointmentsCount: appointments.filter((appointment) => appointment.paymentStatus !== 'Paid').length,
    revenueLabel: formatCurrency(sumBy(paidAppointments, (appointment) => appointment.totalAmount)),
    appointments: appointments.map((appointment) => getAppointmentView(state, appointment))
  };
}

export async function getDoctorAvailability() {
  const state = readState();
  const { doctor } = getDoctorContext(state);
  const slots = getDoctorScheduleEntries(state, doctor.id);
  const dayCounts = countBy(slots, (item) => item.dayLabel);

  return {
    totalSlotGroupsCount: slots.length,
    totalVisibleSlotsCount: sumBy(slots, (item) => item.slotValues.length),
    activeDaysCount: Object.keys(dayCounts).length,
    nextAvailabilityLabel: getNextAvailabilityLabel(state, doctor.id),
    dayBreakdown: Object.entries(dayCounts).map(([label, value]) => ({
      label,
      detail: `${value} session block(s)`,
      valueLabel: `${String(sumBy(slots.filter((item) => item.dayLabel === label), (item) => item.slotValues.length)).padStart(2, '0')} slots`
    })),
    slots: clone(slots)
  };
}

export async function getDoctorEarnings() {
  const state = readState();
  const { doctor } = getDoctorContext(state);
  const appointments = state.appointments.filter((appointment) => appointment.doctorId === doctor.id);
  const paidAppointments = appointments.filter(isPaidAppointment);
  const totalEarnings = sumBy(paidAppointments, (appointment) => appointment.totalAmount);

  const paymentMethodTotals = paidAppointments.reduce((result, appointment) => {
    result[appointment.paymentMethod] = (result[appointment.paymentMethod] || 0) + appointment.totalAmount;
    return result;
  }, {});

  const statusCounts = countBy(appointments, (appointment) => appointment.status);

  return {
    totalEarningsLabel: formatCurrency(totalEarnings),
    thisMonthLabel: formatCurrency(sumCurrentMonth(paidAppointments)),
    averagePerVisitLabel: formatCurrency(paidAppointments.length ? Math.round(totalEarnings / paidAppointments.length) : 0),
    pendingPayoutLabel: formatCurrency(sumBy(appointments.filter((appointment) => appointment.paymentStatus !== 'Paid'), (appointment) => appointment.totalAmount)),
    pendingPaymentCount: appointments.filter((appointment) => appointment.paymentStatus !== 'Paid').length,
    paidAppointmentsCount: paidAppointments.length,
    revenueTrendLabel: getRevenueTrendLabel(appointments),
    paymentMethodBreakdown: buildBreakdownRows(paymentMethodTotals, {
      Card: 'Collected through card payments',
      UPI: 'Collected through UPI',
      'Net Banking': 'Collected through net banking',
      'Cash at clinic': 'Collected at clinic'
    }, (value) => formatCurrency(value)),
    statusBreakdown: buildBreakdownRows(statusCounts, {
      Confirmed: 'Upcoming paid appointments',
      Completed: 'Finished consultations',
      'Payment Pending': 'Awaiting payment confirmation'
    }, (value) => String(value).padStart(2, '0'))
  };
}

export async function getDoctorProfile() {
  const state = readState();
  const { doctor } = getDoctorContext(state);
  const appointments = state.appointments.filter((appointment) => appointment.doctorId === doctor.id);
  const slots = getDoctorScheduleEntries(state, doctor.id);

  return {
    doctor: clone(doctor),
    totalAppointmentsCount: appointments.length,
    upcomingAppointmentsCount: appointments.filter(isUpcomingAppointment).length,
    distinctPatientsCount: new Set(appointments.map((appointment) => appointment.patientId)).size,
    totalEarningsLabel: formatCurrency(sumBy(appointments.filter(isPaidAppointment), (appointment) => appointment.totalAmount)),
    totalAvailabilityBlocks: slots.length,
    availabilityPreview: clone(slots.slice(0, 3)),
    recentAppointments: appointments
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 4)
      .map((appointment) => getAppointmentView(state, appointment))
  };
}

export async function getAdminDashboard() {
  const state = readState();
  requireRole(state, 'Admin');
  const approvedDoctors = getApprovedDoctors(state);
  const paidAppointments = state.appointments.filter(isPaidAppointment);
  const recentDoctorRequests = state.doctors
    .slice()
    .sort((left, right) => new Date(right.requestedAt) - new Date(left.requestedAt))
    .slice(0, 4)
    .map((doctor) => ({
      id: doctor.id,
      fullName: doctor.fullName,
      specialization: doctor.specialization,
      city: doctor.city,
      requestedAt: doctor.requestedAt,
      status: doctor.verificationStatus
    }));

  return {
    metrics: {
      totalDoctors: approvedDoctors.length,
      totalPatients: state.patients.length,
      totalAppointments: state.appointments.length,
      revenueLabel: formatCurrency(sumBy(paidAppointments, (appointment) => appointment.totalAmount)),
      pendingDoctorVerifications: state.doctors.filter((doctor) => doctor.verificationStatus === 'Pending').length,
      pendingPayments: state.appointments.filter((appointment) => appointment.paymentStatus !== 'Paid').length,
      activeDoctors: approvedDoctors.length,
      newRegistrations: state.users.filter((user) => new Date(user.createdAt) >= addDays(new Date(), -30)).length,
      weeklyAppointments: state.appointments.filter((appointment) => new Date(appointment.createdAt) >= addDays(new Date(), -7)).length
    },
    recentDoctorRequests,
    recentAppointments: state.appointments
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 5)
      .map((appointment) => getAppointmentView(state, appointment))
  };
}

export async function getDoctorVerification(params = {}) {
  const state = readState();
  requireRole(state, 'Admin');
  const searchTerm = String(params.searchTerm || '').trim().toLowerCase();
  const statusFilter = String(params.statusFilter || 'Pending');

  const requests = state.doctors
    .filter((doctor) => {
      const matchesSearch =
        !searchTerm ||
        [doctor.fullName, doctor.email, doctor.specialization, doctor.hospitalName, doctor.city]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || doctor.verificationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .slice()
    .sort((left, right) => new Date(right.requestedAt) - new Date(left.requestedAt))
    .map((doctor) => ({
      ...clone(doctor),
      status: doctor.verificationStatus
    }));

  return {
    pendingRequestsCount: state.doctors.filter((doctor) => doctor.verificationStatus === 'Pending').length,
    approvedRequestsCount: state.doctors.filter((doctor) => doctor.verificationStatus === 'Approved').length,
    rejectedRequestsCount: state.doctors.filter((doctor) => doctor.verificationStatus === 'Rejected').length,
    verifiedDoctorsCount: state.doctors.filter((doctor) => doctor.verificationStatus === 'Approved').length,
    requests
  };
}

export async function approveDoctorRequest(requestId) {
  const state = readState();
  requireRole(state, 'Admin');
  const doctor = state.doctors.find((item) => item.id === Number(requestId));
  if (!doctor) {
    throw createError('Doctor request was not found.');
  }

  doctor.verificationStatus = 'Approved';
  doctor.verifiedAt = new Date().toISOString();
  writeState(state);

  return {
    message: 'Doctor request approved successfully.'
  };
}

export async function rejectDoctorRequest(requestId) {
  const state = readState();
  requireRole(state, 'Admin');
  const doctor = state.doctors.find((item) => item.id === Number(requestId));
  if (!doctor) {
    throw createError('Doctor request was not found.');
  }

  doctor.verificationStatus = 'Rejected';
  writeState(state);

  return {
    message: 'Doctor request rejected successfully.'
  };
}

export async function getAdminAppointments(params = {}) {
  const state = readState();
  requireRole(state, 'Admin');
  const searchTerm = String(params.searchTerm || '').trim().toLowerCase();
  const statusFilter = String(params.statusFilter || 'All');
  const paymentFilter = String(params.paymentFilter || 'All');

  const appointments = state.appointments
    .filter((appointment) => {
      const view = getAppointmentView(state, appointment);
      const matchesSearch =
        !searchTerm ||
        [view.patientName, view.doctorName, view.doctorSpecialization, view.dateLabel, view.paymentStatus, view.paymentMethod]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || appointment.status === statusFilter;
      const matchesPayment = paymentFilter === 'All' || appointment.paymentStatus === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    })
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return {
    totalAppointmentsCount: appointments.length,
    confirmedAppointmentsCount: appointments.filter((appointment) => appointment.status === 'Confirmed').length,
    completedAppointmentsCount: appointments.filter((appointment) => appointment.status === 'Completed').length,
    pendingPaymentsCount: appointments.filter((appointment) => appointment.paymentStatus !== 'Paid').length,
    revenueLabel: formatCurrency(sumBy(appointments.filter(isPaidAppointment), (appointment) => appointment.totalAmount)),
    appointments: appointments.map((appointment) => getAppointmentView(state, appointment))
  };
}

export async function getAdminUsers(params = {}) {
  const state = readState();
  requireRole(state, 'Admin');
  const searchTerm = String(params.searchTerm || '').trim().toLowerCase();
  const roleFilter = String(params.roleFilter || 'All');
  const statusFilter = String(params.statusFilter || 'All');

  const patientRows = state.patients.map((patient) => ({
    entityId: patient.id,
    name: patient.fullName,
    role: 'Patient',
    status: 'Active',
    detail: patient.email,
    canDelete: false
  }));

  const doctorRows = state.doctors.map((doctor) => ({
    entityId: doctor.id,
    name: doctor.fullName,
    role: 'Doctor',
    status: getDoctorStatusLabel(doctor),
    detail: `${doctor.specialization} - ${doctor.city}`,
    canDelete: state.appointments.every((appointment) => appointment.doctorId !== doctor.id)
  }));

  const users = [...patientRows, ...doctorRows].filter((user) => {
    const matchesSearch = !searchTerm || [user.name, user.role, user.status, user.detail].join(' ').toLowerCase().includes(searchTerm);
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return {
    patientCount: state.patients.length,
    verifiedDoctorCount: state.doctors.filter((doctor) => doctor.verificationStatus === 'Approved').length,
    pendingDoctorCount: state.doctors.filter((doctor) => doctor.verificationStatus === 'Pending').length,
    users
  };
}

export async function createAdminDoctor(payload) {
  const state = readState();
  requireRole(state, 'Admin');
  ensureUniqueEmail(state, payload?.email);
  validatePasswordPair(payload?.password, payload?.confirmPassword);

  const fullName = String(payload?.name || '').trim();
  const specialization = String(payload?.specialization || '').trim();
  const licenseNumber = String(payload?.license || '').trim();

  if (!fullName || !specialization || !licenseNumber) {
    throw createError('Doctor name, specialization, and license number are required.');
  }

  const userId = nextId(state.users);
  const doctorId = nextId(state.doctors);

  state.users.push({
    id: userId,
    role: 'Doctor',
    email: String(payload.email).trim(),
    password: payload.password,
    displayName: fullName,
    initials: getInitials(fullName),
    entityId: doctorId,
    createdAt: new Date().toISOString()
  });

  state.doctors.push({
    id: doctorId,
    userId,
    fullName,
    email: String(payload.email).trim(),
    specialization,
    licenseNumber,
    experienceYears: Number(payload.experienceYears || 5),
    city: String(payload.city || 'Ahmedabad').trim(),
    consultationFee: Number(payload.consultationFee || 700),
    hospitalName: String(payload.hospitalName || 'MediCore Clinic').trim(),
    bio: `Directly onboarded by admin for ${specialization.toLowerCase()} workflows and patient booking access.`,
    languages: 'English, Hindi',
    rating: 4.5,
    verificationStatus: 'Approved',
    requestedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    avatarPath: buildAvatar(fullName, '#ffffff', '#142f55')
  });

  state.availabilities.push(...createDoctorAvailabilitySet(doctorId, 'mixed'));
  writeState(state);

  return {
    message: 'Doctor account created successfully.'
  };
}

export async function deleteAdminDoctor(doctorId) {
  const state = readState();
  requireRole(state, 'Admin');
  const doctor = state.doctors.find((item) => item.id === Number(doctorId));
  if (!doctor) {
    throw createError('Doctor record was not found.');
  }

  if (state.appointments.some((appointment) => appointment.doctorId === doctor.id)) {
    throw createError('This doctor cannot be deleted because appointments already exist.');
  }

  state.doctors = state.doctors.filter((item) => item.id !== doctor.id);
  state.users = state.users.filter((item) => item.id !== doctor.userId);
  state.availabilities = state.availabilities.filter((item) => item.doctorId !== doctor.id);
  removeUserSessions(state, doctor.userId);
  writeState(state);

  return {
    message: 'Doctor account deleted successfully.'
  };
}

export async function getAdminReports() {
  const state = readState();
  requireRole(state, 'Admin');
  const appointmentStatusCounts = countBy(state.appointments, (appointment) => appointment.status);
  const requestStatusCounts = countBy(state.doctors, (doctor) => doctor.verificationStatus);
  const paymentMethodTotals = state.appointments.filter(isPaidAppointment).reduce((result, appointment) => {
    result[appointment.paymentMethod] = (result[appointment.paymentMethod] || 0) + appointment.totalAmount;
    return result;
  }, {});
  const specializationCounts = countBy(getApprovedDoctors(state), (doctor) => doctor.specialization);

  return {
    metrics: {
      weeklyAppointments: state.appointments.filter((appointment) => new Date(appointment.createdAt) >= addDays(new Date(), -7)).length,
      newRegistrations: state.users.filter((user) => new Date(user.createdAt) >= addDays(new Date(), -30)).length,
      approvalRateLabel: getApprovalRateLabel(state),
      revenueTrendLabel: getRevenueTrendLabel(state.appointments),
      revenueLabel: formatCurrency(sumBy(state.appointments.filter(isPaidAppointment), (appointment) => appointment.totalAmount))
    },
    appointmentStatusBreakdown: buildBreakdownRows(appointmentStatusCounts, {
      Confirmed: 'Upcoming paid appointments',
      Completed: 'Finished patient visits',
      'Payment Pending': 'Bookings waiting for payment'
    }, (value) => String(value).padStart(2, '0')),
    requestStatusBreakdown: buildBreakdownRows(requestStatusCounts, {
      Approved: 'Doctors already visible in the directory',
      Pending: 'Profiles awaiting review',
      Rejected: 'Declined doctor applications'
    }, (value) => String(value).padStart(2, '0')),
    paymentMethodBreakdown: buildBreakdownRows(paymentMethodTotals, {
      Card: 'Completed card collections',
      UPI: 'Completed UPI collections',
      'Net Banking': 'Completed bank collections',
      'Cash at clinic': 'Collected at visit time'
    }, (value) => formatCurrency(value)),
    specializationBreakdown: buildBreakdownRows(specializationCounts, {}, (value) => String(value).padStart(2, '0'))
  };
}
