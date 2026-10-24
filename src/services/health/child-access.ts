import type { SupabaseClient } from "@supabase/supabase-js"
import { AppError } from "@/services/contracts"
import type { ChildSex } from "@/types"
import { asIsoDate, type ChildAccessRow } from "./mappers.ts"
import { assertUuid, throwSupabaseError } from "./supabase-error.ts"

export interface AuthorizedChild {
  id: string
  dateOfBirth: string
  sex: ChildSex
}

/** Confirms the signed-in caregiver can read this child. RLS hides every other child. */
export async function requireChild(
  supabase: SupabaseClient,
  childId: string,
): Promise<AuthorizedChild> {
  assertUuid(childId, "Child id")
  const { data, error } = await supabase
    .from("children")
    .select("id, date_of_birth, sex")
    .eq("id", childId)
    .maybeSingle()

  if (error) throwSupabaseError(error)
  if (!data) throw new AppError("not_found", "The child was not found.")

  const row = data as ChildAccessRow
  if (row.sex !== "male" && row.sex !== "female") {
    throw new AppError("unavailable", "The child sex value could not be read.")
  }
  return { id: row.id, dateOfBirth: asIsoDate(row.date_of_birth), sex: row.sex }
}
