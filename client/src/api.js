const API_URL = ''; // Порожній рядок, бо Vite використовує proxy. При деплої це полегшить життя.
export const API = {
  SERVICES: `${API_URL}/api/services`,
  CLIENTS: `${API_URL}/api/clients`,
  APPOINTMENTS: `${API_URL}/api/appointments`,
  CALENDAR: `${API_URL}/api/calendar`
};
