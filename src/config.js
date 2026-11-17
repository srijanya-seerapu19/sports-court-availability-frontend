// Configure backend API base URL dynamically for Vite
// In local development, connects directly to http://localhost:8080/api
// In production or when VITE_API_URL is set, uses the deployed backend URL

const defaultUrl = import.meta.env.DEV
  ? 'http://localhost:8080/api'
  : 'https://sports-court-availability-backend.onrender.com/api';

const rawUrl = import.meta.env.VITE_API_URL || defaultUrl;

const cleanUrl = rawUrl.replace(/\/+$/, '');
const API = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

export default API;