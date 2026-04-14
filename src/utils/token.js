import { jwtDecode } from 'jwt-decode'

export function decodeTokenSafely(token) {
  if (!token) {
    return null
  }

  try {
    return jwtDecode(token)
  } catch {
    return null
  }
}
