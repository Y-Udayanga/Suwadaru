/** A labeled demonstration session. It is not an authenticated account. */
export interface DemoSession {
  caregiverId: string
  displayName: string
  isDemo: true
}

export interface DemoSignInInput {
  /** Fictional display name. Do not collect a password or national identifier. */
  displayName: string
}
