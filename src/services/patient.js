import { request, toQueryString } from './http';

export function getPatientDashboard() {
  return request('/patient/dashboard');
}

export function findDoctors(params = {}) {
  return request(`/patient/doctors${toQueryString(params)}`);
}

export function getPatientDoctorProfile(doctorId) {
  return request(`/patient/doctors/${doctorId}`);
}

export function getBookingPage(doctorId) {
  return request(`/patient/bookings/doctors/${doctorId}`);
}

export function getPaymentPage(appointmentId) {
  return request(`/patient/appointments/${appointmentId}/payment`);
}

export function getBookingConfirmation(appointmentId) {
  return request(`/patient/appointments/${appointmentId}/confirmation`);
}

export function getPatientAppointmentHistory() {
  return request('/patient/appointments');
}

export function getPatientNotifications() {
  return request('/patient/notifications');
}

export function getPatientProfile() {
  return request('/patient/profile');
}
