// Configure backend API base URL dynamically for Vite
// In Render frontend Environment: set VITE_API_URL to your deployed backend URL
// Local fallback: http://localhost:8080/api

const rawUrl = import.meta.env.VITE_API_URL || 'https://sports-court-availability-backend.onrender.com';

const cleanUrl = rawUrl.replace(/\/+$/, '');
const API = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

export default API;