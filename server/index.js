import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import * as store from './lib/medicoreStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT || 5000);

const app = express();

app.use(
  cors({
    origin: true,
    credentials: false
  })
);
app.use(express.json());

function getSessionToken(request) {
  const authorization = String(request.headers.authorization || '').trim();
  return authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : null;
}

function getStatusCode(error) {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('not found')) {
    return 404;
  }

  if (message.includes('please sign in')) {
    return 401;
  }

  if (message.includes('requires a')) {
    return 403;
  }

  return 400;
}

function route(handler, { auth = false } = {}) {
  return async (request, response) => {
    try {
      const sessionToken = getSessionToken(request);

      if (auth && !sessionToken) {
        response.status(401).json({ message: 'Please sign in to continue.' });
        return;
      }

      const result = auth
        ? await store.withSession(sessionToken, () => handler(request, sessionToken))
        : await handler(request, sessionToken);

      if (response.headersSent) {
        return;
      }

      if (result === undefined) {
        response.status(204).end();
        return;
      }

      response.json(result);
    } catch (error) {
      response.status(getStatusCode(error)).json({
        message: error?.message || 'Request failed.'
      });
    }
  };
}

app.get('/api/health', route(async () => ({ ok: true })));

app.post('/api/auth/login', route((request) => store.login(request.body)));
app.get('/api/auth/me', route(() => store.getMe(), { auth: true }));
app.post('/api/auth/logout', route(() => store.logout(), { auth: true }));
app.post('/api/auth/forgot-password', route((request) => store.forgotPassword(request.body)));
app.post('/api/auth/reset-password', route((request) => store.resetPassword(request.body)));
app.post('/api/auth/register/patient', route((request) => store.registerPatient(request.body)));
app.post('/api/auth/register/doctor', route((request) => store.registerDoctor(request.body)));
app.post('/api/auth/register/admin', route((request) => store.registerAdmin(request.body)));

app.get('/api/patient/dashboard', route(() => store.getPatientDashboard(), { auth: true }));
app.get('/api/patient/doctors', route((request) => store.findDoctors(request.query), { auth: true }));
app.get('/api/patient/doctors/:doctorId', route((request) => store.getPatientDoctorProfile(request.params.doctorId), { auth: true }));
app.get('/api/patient/bookings/doctors/:doctorId', route((request) => store.getBookingPage(request.params.doctorId), { auth: true }));
app.post('/api/patient/appointments', route((request) => store.createAppointment(request.body), { auth: true }));
app.get('/api/patient/appointments/:appointmentId/payment', route((request) => store.getPaymentPage(request.params.appointmentId), { auth: true }));
app.post('/api/patient/appointments/:appointmentId/payment', route((request) => store.completeAppointmentPayment(request.params.appointmentId, request.body), { auth: true }));
app.get('/api/patient/appointments/:appointmentId/confirmation', route((request) => store.getBookingConfirmation(request.params.appointmentId), { auth: true }));
app.get('/api/patient/appointments', route(() => store.getPatientAppointmentHistory(), { auth: true }));
app.get('/api/patient/notifications', route(() => store.getPatientNotifications(), { auth: true }));
app.get('/api/patient/profile', route(() => store.getPatientProfile(), { auth: true }));

app.get('/api/doctor/dashboard', route(() => store.getDoctorDashboard(), { auth: true }));
app.get('/api/doctor/appointments', route((request) => store.getDoctorAppointments(request.query), { auth: true }));
app.get('/api/doctor/availability', route(() => store.getDoctorAvailability(), { auth: true }));
app.get('/api/doctor/earnings', route(() => store.getDoctorEarnings(), { auth: true }));
app.get('/api/doctor/profile', route(() => store.getDoctorProfile(), { auth: true }));

app.get('/api/admin/dashboard', route(() => store.getAdminDashboard(), { auth: true }));
app.get('/api/admin/doctor-verification', route((request) => store.getDoctorVerification(request.query), { auth: true }));
app.post('/api/admin/doctor-verification/:requestId/approve', route((request) => store.approveDoctorRequest(request.params.requestId), { auth: true }));
app.post('/api/admin/doctor-verification/:requestId/reject', route((request) => store.rejectDoctorRequest(request.params.requestId), { auth: true }));
app.get('/api/admin/appointments', route((request) => store.getAdminAppointments(request.query), { auth: true }));
app.get('/api/admin/users', route((request) => store.getAdminUsers(request.query), { auth: true }));
app.post('/api/admin/doctors', route((request) => store.createAdminDoctor(request.body), { auth: true }));
app.delete('/api/admin/doctors/:doctorId', route((request) => store.deleteAdminDoctor(request.params.doctorId), { auth: true }));
app.get('/api/admin/reports', route(() => store.getAdminReports(), { auth: true }));
app.use('/api', (_request, response) => {
  response.status(404).json({
    message: 'API route was not found.'
  });
});

if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));

  app.get('/{*path}', (request, response, next) => {
    if (request.path.startsWith('/api/')) {
      next();
      return;
    }

    response.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`MediCore server listening on http://127.0.0.1:${PORT}`);
});

server.on('error', (error) => {
  console.error(`MediCore server failed on port ${PORT}: ${error?.message || error}`);
  process.exit(1);
});

function shutdown(signal) {
  server.close(() => {
    console.log(`MediCore server stopped after ${signal}.`);
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
