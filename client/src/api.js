const API_URL =
  typeof window !== 'undefined' &&
  window.location.hostname.includes('netlify.app')
    ? 'https://beauty-app-five-olive.vercel.app/'
    : ''; // Порожній рядок, бо Vite використовує proxy. При деплої це полегшить життя.
export const API = {
  SERVICES: `${API_URL}/api/services`,
  CLIENTS: `${API_URL}/api/clients`,
  APPOINTMENTS: `${API_URL}/api/appointments`,
  CALENDAR: `${API_URL}/api/calendar`,
};
