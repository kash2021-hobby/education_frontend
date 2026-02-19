import { API_BASE } from './config'
import { getAuthToken, clearAuthToken } from './auth'

export async function apiFetch(path, options = {}) {
  const token = getAuthToken()
  const headers = {
    ...(options.headers || {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    clearAuthToken()
    window.location.replace('/login')
    throw new Error('Session expired. Please log in again.')
  }

  return res
}

