import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { api } from './api'
import { toast } from './effects'

const Ctx = createContext(null)

export const useAuth = () =>
  useContext(Ctx)

const wait = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  )

export function AuthProvider({ children }) {
  const [user, setUser] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  // Restore the login when the app opens.
  useEffect(() => {
    let cancelled = false

    if (!localStorage.getItem('token')) {
      setLoading(false)
      return
    }

    async function restore() {
      // The free Render server can need up to a minute to wake up.
      // Before: any network error deleted the token, so students were
      // logged out every time the server was asleep. Now we only log out
      // when the server clearly says the token is not valid.
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const d = await api('/auth/me')

          if (!cancelled) {
            setUser(d.user)
          }

          return
        } catch (err) {
          if (
            err.status === 401 ||
            err.status === 403
          ) {
            localStorage.removeItem('token')
            return
          }

          if (cancelled || attempt === 3) {
            return // keep the token; a refresh will try again
          }

          await wait(3000 * (attempt + 1))
        }
      }
    }

    restore().finally(() => {
      if (!cancelled) {
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  // api.js tells us when the server rejects the saved login
  useEffect(() => {
    const onExpired = () => {
      localStorage.removeItem('token')
      setUser(null)

      toast(
        'error',
        'Your session has ended. Please log in again.'
      )
    }

    window.addEventListener(
      'auth-expired',
      onExpired
    )

    return () =>
      window.removeEventListener(
        'auth-expired',
        onExpired
      )
  }, [])

  const login = async (
    email,
    password
  ) => {
    const d = await api(
      '/auth/login',
      {
        method: 'POST',
        body: {
          email,
          password,
        },
      }
    )

    localStorage.setItem(
      'token',
      d.token
    )

    setUser(d.user)

    return d.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
