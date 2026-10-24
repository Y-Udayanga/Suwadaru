import { supabase } from '../../utils/supabase'
import { createAuthService } from './auth-service'

export const authService = createAuthService(supabase, () => window.location.origin)
export { AuthServiceError, toAuthError, createAuthService } from './auth-service'
export type { AuthErrorCode, ConnectedAuthService, SignInInput, SignUpInput, SignUpResult } from './auth-service'
