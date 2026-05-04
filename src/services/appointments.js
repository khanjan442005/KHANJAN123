import { request } from './http';

export function createAppointment(payload) {
  return request('/patient/appointments', {
    method: 'POST',
    body: payload
  });
}

export function completeAppointmentPayment(appointmentId, payload) {
  return request(`/patient/appointments/${appointmentId}/payment`, {
    method: 'POST',
    body: payload
  });
}
