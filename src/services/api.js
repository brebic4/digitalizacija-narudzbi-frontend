import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export function setupApiResponseInterceptor(authStore, router) {
  api.interceptors.response.use(
    (response) => response,

    async (error) => {
      const status = error.response?.status
      const requestUrl = error.config?.url || ''

      const isLoginRequest = requestUrl.includes('/auth/login')

      /*
       * Pogrešni podaci za prijavu također mogu vratiti 401.
       * U tom slučaju korisnika ne preusmjeravamo jer se već
       * nalazi na login stranici.
       */
      if (status === 401 && !isLoginRequest) {
        const currentRoute = router.currentRoute.value

        const redirectPath = currentRoute.name === 'login' ? '/dashboard' : currentRoute.fullPath

        authStore.logout()

        if (currentRoute.name !== 'login') {
          await router.replace({
            name: 'login',
            query: {
              reason: 'session-expired',
              redirect: redirectPath,
            },
          })
        }
      }

      return Promise.reject(error)
    },
  )
}

export default api
