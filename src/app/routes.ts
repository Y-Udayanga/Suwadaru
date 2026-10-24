export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  authCallback: "/auth/callback",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  newChild: "/children/new",
  child: (childId: string) => `/children/${encodeURIComponent(childId)}`,
  vaccinations: (childId: string) =>
    `/children/${encodeURIComponent(childId)}/vaccinations`,
  growth: (childId: string) =>
    `/children/${encodeURIComponent(childId)}/growth`,
  nutrition: (childId: string) =>
    `/children/${encodeURIComponent(childId)}/nutrition`,
  appointments: (childId: string) =>
    `/children/${encodeURIComponent(childId)}/appointments`,
} as const
