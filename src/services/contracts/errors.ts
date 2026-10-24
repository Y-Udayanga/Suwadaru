export class AppError extends Error {
  readonly code: AppErrorCode

  constructor(code: AppErrorCode, message: string) {
    super(message)
    this.name = "AppError"
    this.code = code
  }
}

export type AppErrorCode =
  | "unauthenticated"
  | "not_found"
  | "validation"
  | "unavailable"
