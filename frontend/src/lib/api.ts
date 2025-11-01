import axios from 'axios'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'

const api = axios.create({ baseURL: '/api' })

// attach headers automatically
api.interceptors.request.use((config) => {
  const token = useAuth.getState().token
  const sid = useCart.getState().sessionId
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  if (sid) config.headers['X-Session-Id'] = sid
  return config
})

export default api
