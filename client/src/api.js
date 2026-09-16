const API_URL = import.meta.env.VITE_API_URL || '';
export const API = {
  SERVICES: `${API_URL}/api/services`,
  CLIENTS: `${API_URL}/api/clients`,
  APPOINTMENTS: `${API_URL}/api/appointments`,
  CALENDAR: `${API_URL}/api/calendar`,
};
