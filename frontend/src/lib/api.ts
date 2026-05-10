import axios from "axios"
import { clearSessionUser, getAuthToken } from "@/lib/sessionUser"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"

/** Axios instance that attaches JWT and handles auth failures for logged-in calls. */
export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)
    const status = error.response?.status
    /* If we're holding a token, a 401 means it expired or was rejected — clear client session. */
    if (status === 401 && getAuthToken()) {
      clearSessionUser()
      window.location.assign("/login")
    }
    return Promise.reject(error)
  }
)
