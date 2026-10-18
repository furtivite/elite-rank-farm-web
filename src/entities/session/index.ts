export { useSession, useIsAdmin } from '@/entities/session/model/useSession'
export type { UseSessionResult, SignInOutcome } from '@/entities/session/model/useSession'
export {
  changePassword,
  completePasswordReset,
  confirmEmail,
  register,
  requestPasswordReset,
  resendConfirmationCode,
  resubscribeEmails,
  unsubscribeEmails,
  issueDeviceToken,
  signOutOtherSessions,
  signOutTestUsers,
} from '@/entities/session/api/authApi'
export type { SignInObstacle } from '@/entities/session/api/authApi'
export { refreshSession } from '@/entities/session/model/sessionStore'
export type { SessionStatus, SessionUser } from '@/entities/session/model/types'
export {
  fetchViewPreferences,
  saveViewPreferences,
  type ViewPreferences,
} from '@/entities/session/api/viewPreferencesApi'
