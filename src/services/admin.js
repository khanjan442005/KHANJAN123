import { request, toQueryString } from './http';

export function getAdminDashboard() {
  return request('/admin/dashboard');
}

export function getDoctorVerification(params = {}) {
  return request(`/admin/doctor-verification${toQueryString(params)}`);
}

export function approveDoctorRequest(requestId) {
  return request(`/admin/doctor-verification/${requestId}/approve`, {
    method: 'POST'
  });
}

export function rejectDoctorRequest(requestId) {
  return request(`/admin/doctor-verification/${requestId}/reject`, {
    method: 'POST'
  });
}

export function getAdminAppointments(params = {}) {
  return request(`/admin/appointments${toQueryString(params)}`);
}

export function getAdminUsers(params = {}) {
  return request(`/admin/users${toQueryString(params)}`);
}

export function createAdminDoctor(payload) {
  return request('/admin/doctors', {
    method: 'POST',
    body: payload
  });
}

export function deleteAdminDoctor(doctorId) {
  return request(`/admin/doctors/${doctorId}`, {
    method: 'DELETE'
  });
}

export function getAdminReports() {
  return request('/admin/reports');
}
