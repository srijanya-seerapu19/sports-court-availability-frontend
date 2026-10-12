// Configure backend API base URL dynamically for Vite
// In Render frontend Environment: set VITE_API_URL to your deployed backend URL
// Local fallback: http://localhost:8080/api

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const cleanUrl = rawUrl.replace(/\/+$/, '');
const API = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

export default API;