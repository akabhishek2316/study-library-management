import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { api } from './api'

const Ctx = createContext(null)

export const useAuth = () =>
  useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      return setLoading(false)
    }

    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() =>
        localStorage.removeItem('token')
      )
      .finally(() =>
        setLoading(false)
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