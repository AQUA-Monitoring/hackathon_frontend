import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'https://api-aqua.michalski.app/api/',
})

export default api
