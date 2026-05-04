import { request, toQueryString } from './http';

export function getDoctorDashboard() {
  return request('/doctor/dashboard');
}

export function getDoctorAppointments(params = {}) {
  return request(`/doctor/appointments${toQueryString(params)}`);
}

export function getDoctorAvailability() {
  return request('/doctor/availability');
}

export function getDoctorEarnings() {
  return request('/doctor/earnings');
}

export function getDoctorProfile() {
  return request('/doctor/profile');
}
