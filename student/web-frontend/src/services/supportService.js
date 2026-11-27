import axios from 'axios';

const envBase =
  import.meta.env.VITE_CONTACT_API_BASE_URL ||
  import.meta.env.VITE_CONTACT_API_URL ||
  'http://localhost:4100';

export const CONTACT_API_BASE_URL = String(envBase).replace(/\/$/, '');

const supportClient = axios.create({
  baseURL: CONTACT_API_BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

export const submitComplaint = async (payload) => {
  const { data } = await supportClient.post('/api/v1/support/complaints', payload);
  return data;
};

export const trackComplaint = async (ticketRef, email) => {
  const { data } = await supportClient.get(
    `/api/v1/support/complaints/${encodeURIComponent(ticketRef)}`,
    { params: { email } }
  );
  return data;
};
