export type SessionStatus = 'unknown' | 'guest' | 'user'

export type SessionUser = {
  login: string
  email: string
  isTestUser: boolean
  isAdmin: boolean
}
