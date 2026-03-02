// Use VITE_API_URL in .env for production, e.g. VITE_API_URL=https://api.example.com
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Telegram notification app URL – open in new tab. Set in .env, e.g. VITE_NOTIFICATION_APP_URL=https://notifications.example.com
export const NOTIFICATION_APP_URL = import.meta.env.VITE_NOTIFICATION_APP_URL || ''
