import type { Child, CreateChildInput, UpdateChildInput } from "@/types"
import { AppError } from "@/services/contracts"
import { supabase } from "@/utils/supabase"
import { asIsoDate, optionalNumber } from "./mappers.ts"
import { hasCaregiverSession } from "./session.ts"
import { throwSupabaseError } from "./supabase-error.ts"

const CHILD_COLUMNS = "id, name, date_of_birth, sex, birth_weight_kg"

interface ChildRow {
  id: string
  name: string
  date_of_birth: string
  sex: string
  birth_weight_kg: number | string | null
}

/**
 * Caregiver children visible through the signed-in session.
 * Returns null when there is no Supabase session, so the demo list can stay.
 * An empty array means the signed-in caregiver has no children.
 */
export async function listCaregiverChildren(): Promise<Child[] | null> {
  if (!(await hasCaregiverSession())) return null
  const { data, error } = await supabase
    .from("children")
    .select(CHILD_COLUMNS)
    .order("name", { ascending: true })

  if (error) throwSupabaseError(error)
  return ((data ?? []) as ChildRow[]).map(toChild)
}

export async function getCaregiverChild(childId: string): Promise<Child> {
  if (!(await hasCaregiverSession())) {
    throw new AppError("unauthenticated", "Authentication required.")
  }
  const { data, error } = await supabase
    .from("children")
    .select(CHILD_COLUMNS)
    .eq("id", childId)
    .maybeSingle()

  if (error) throwSupabaseError(error)
  if (!data) throw new AppError("not_found", "The child was not found.")
  return toChild(data as ChildRow)
}

/** Uses Member 3's create_child RPC. The browser does not insert the membership row. */
export async function createCaregiverChild(input: CreateChildInput): Promise<Child> {
  if (!(await hasCaregiverSession())) {
    throw new AppError("unauthenticated", "Authentication required.")
  }
  const { data, error } = await supabase.rpc("create_child", {
    p_name: input.name.trim(),
    p_date_of_birth: input.dateOfBirth,
    p_sex: input.sex,
    p_birth_weight_kg: input.birthWeightKg ?? null,
    p_relationship: "parent",
  })
  if (error) throwSupabaseError(error)
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new AppError("unavailable", "The child profile could not be created.")
  return toChild(row as ChildRow)
}

export async function updateCaregiverChild(
  childId: string,
  input: UpdateChildInput,
): Promise<Child> {
  if (!(await hasCaregiverSession())) {
    throw new AppError("unauthenticated", "Authentication required.")
  }
  const patch: Record<string, string | number | null> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.dateOfBirth !== undefined) patch.date_of_birth = input.dateOfBirth
  if (input.sex !== undefined) patch.sex = input.sex
  if (input.birthWeightKg !== undefined) patch.birth_weight_kg = input.birthWeightKg
  if (Object.keys(patch).length === 0) {
    return getCaregiverChild(childId)
  }

  const { data, error } = await supabase
    .from("children")
    .update(patch)
    .eq("id", childId)
    .select(CHILD_COLUMNS)
    .maybeSingle()

  if (error) throwSupabaseError(error)
  if (!data) throw new AppError("not_found", "The child was not found.")
  return toChild(data as ChildRow)
}

function toChild(row: ChildRow): Child {
  if (row.sex !== "male" && row.sex !== "female") {
    throw new AppError("unavailable", "The child sex value could not be read.")
  }
  const birthWeightKg = optionalNumber(row.birth_weight_kg)
  return {
    id: row.id,
    name: row.name,
    dateOfBirth: asIsoDate(row.date_of_birth),
    sex: row.sex,
    ...(birthWeightKg !== undefined ? { birthWeightKg } : {}),
  }
}
