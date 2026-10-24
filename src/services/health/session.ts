import { AppError } from "@/services/contracts"
import { supabase } from "@/utils/supabase"

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Database child ids are UUIDs. Demonstration ids such as child_nethmi_demo are not. */
export function isPersistedChildId(childId: string): boolean {
  return UUID.test(childId)
}

export async function hasCaregiverSession(): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session?.access_token)
}

/** A persisted child without a session must not fall through to demonstration records. */
export async function requireCaregiverSession(): Promise<void> {
  if (!(await hasCaregiverSession())) {
    throw new AppError("unauthenticated", "Authentication required.")
  }
}
